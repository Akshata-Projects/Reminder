require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

//APP config
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

//DB connection
mongoose
  .connect(
    "mongodb+srv://akshata1234:akshata1234@cluster0.lu5pu.mongodb.net/reminder_DB?retryWrites=true&w=majority"
  )
  .then(() => console.log("Connected Successufully"));

// creating Schema
const reminderSchema = mongoose.Schema({
  reminderMsg: String,
  remindAt: String,
  isReminded: Boolean,
});

// Creating Model for the schema
const reminderData = mongoose.model("reminder", reminderSchema);

//------------------whatsup notification with twilio-------------------------------------------------------
setInterval(() => {
  reminderData.find({}, (err, reminderList) => {
    if (err) {
      console.log(err);
    }
    if (reminderList) {
      reminderList.forEach((reminder) => {
        if (!reminder.isReminded) {
          const now = new Date();
          if (new Date(reminder.remindAt) - now < 0) {
            reminderData.findByIdAndUpdate(
              reminder._id,
              { isReminded: true },
              (err) => {
                if (err) {
                  console.log(err);
                }
                //send msg
                const accountSid = process.env.ACCOUNT_SID;
                const authToken = process.env.AUTH_TOKEN;
                const client = require("twilio")(accountSid, authToken);
                client.messages
                  .create({
                    body: reminder.reminderMsg,
                    from: "whatsapp:+14155238886",
                    to: "whatsapp:+971502164909",
                  })
                  .then((message) => console.log(message.sid))
                  .done();
              }
            );
          }
        }
      });
    }
  });
}, 1000);

//----------------------------------------------------------------------------------------------

//API Routes //List of Reminders
app.get("/getAllReminder", (req, res) => {
  reminderData.find({}, (err, reminderList) => {
    if (err) {
      console.log(err);
    }
    if (reminderList) {
      res.send(reminderList);
    }
  });
});

//Adding Reminders
app.post("/addReminder", async (req, res) => {
  const { reminderMsg, remindAt } = req.body;
  const reminder = new reminderData({
    reminderMsg,
    remindAt,
    isReminded: false,
  });
  await reminder.save((err) => {
    if (err) {
      console.log(err);
    }
    reminderData.find({}, (err, reminderList) => {
      if (err) {
        console.log(err);
      }
      if (reminderList) {
        res.send(reminderList);
      }
    });
  });
});

//Deleting Reminders
app.post("/deleteReminder", (req, res) => {
  reminderData.deleteOne({ _id: req.body.id }, () => {
    reminderData.find({}, (err, reminderList) => {
      if (err) {
        console.log(err);
      }
      if (reminderList) {
        res.send(reminderList);
      }
    });
  });
});

app.listen(7000, () => console.log("Backend Started at port 7000"));
