const express = require("express");
let ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");
var methodOverride = require("method-override");

mongoose.connect("mongodb://localhost:27017/clinicDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const app = express();

const diagnosisSchema = new mongoose.Schema({
  date: Date,
  diagnosis: String,
});

const patientSchema = new mongoose.Schema({
  name: String,
  gender: String,
  birthdate: Date,
  address: String,
  history: [diagnosisSchema],
});
const appointmentSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date
})
const medicineSchema = new mongoose.Schema({
  name: String,
  type: String,
  description: String,
  stocks: Number
})
const Medicine = mongoose.model("medicine", medicineSchema);
const Appointment = mongoose.model("appointment", appointmentSchema);
const Diagnosis = mongoose.model("diagnosis", diagnosisSchema);
const Patient = mongoose.model("patient", patientSchema);

app.set("view engine", "ejs");
app.use(express.static("public/"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", function (req, res) {
  res.render("login");
});
// patient
app.get("/home", function (req, res) {
  res.render("index");
});
app.get("/patients", function (req, res) {
  Patient.find({}, function (err, found) {
    res.render("tables", { found: found });
  });
});
app.get("/patients/:id", function (req, res) {
  const requestedpatient = req.params.id;
  Patient.findOne({ _id: requestedpatient }, function (err, patient) {
    let birthdate = moment(patient.birthdate);
    birthdate = birthdate.format("DD/MM/YYYY");
    res.render("details", { patient: patient, date: birthdate });
  });
});

app.delete("/patients/:id", function (req, res) {
  console.log(req.params.id);
  Patient.deleteOne({ _id: req.params.id }, function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log(success);
    }
  });
  res.redirect("/patients");
});

app.get("/patient/edit/:id", function (req, res) {
  Patient.findOne({ _id: req.params.id }, function (err, patient) {
    let birthdate = moment(patient.birthdate);
    birthdate = birthdate.format("YYYY-MM-DD");
    res.render("patient-edit", { patient: patient, birthdate: birthdate });
  });
});

app.put("/patient/edit/:id", function (req, res) {
  console.log("asdsadsad");
  Patient.updateOne(
    { _id: req.params.id },
    {
      name: req.body.name,
      birthdate: req.body.birthdate,
      gender: req.body.gender,
      address: req.body.address,
    },
    function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log(success);
      }
    }
  );
  res.redirect("/patients");
});

app.get("/create", function (req, res) {
  res.render("NewPatient");
});

app.post("/create", function (req, res) {
  const patient = new Patient({
    name: req.body.name,
    birthdate: req.body.birthdate,
    gender: req.body.gender,
    address: req.body.address,
  });
  patient.save();
  res.redirect("/patients");
});

app.post("/diagnosis", function (req, res) {
  const diagnosis = new Diagnosis({
    date: moment().format("YYYY-MM-DD"),
    diagnosis: req.body.diagnosis,
  });
  diagnosis.save();
  Patient.updateOne(
    { _id: req.body.id },
    { $push: { history: diagnosis } },
    function (err, success) {
      if (err) {
        console.log(err);
      } else {
        console.log(success);
      }
    }
  );
  res.redirect("/patients");
});

app.get("/diagnosis/edit/:patient_id/:diagnosis_id", function (req, res) {
  Diagnosis.findOne({ _id: req.params.diagnosis_id }, function (err, result) {
    let date = moment(result.date);
    date = date.format("YYYY-MM-DD");
    res.render("diagnosis-edit", {
      result: result,
      date: date,
      patient_id: req.params.patient_id,
    });
  });
});
app.put("/diagnosis/edit/:patient_id/:diagnosis_id", function (req, res) {
  Diagnosis.updateOne(
    { _id: req.params.diagnosis_id },
    {
      date: req.body.date,
      diagnosis: req.body.diagnosis,
    },
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
  Patient.findOneAndUpdate(
    { _id: req.params.patient_id, "history._id": req.params.diagnosis_id },
    {
      $set: {
        "history.$.date": req.body.date,
        "history.$.diagnosis": req.body.diagnosis,
      },
    },
    function (err, result) {
      if (err) {
        console.log(err);
      }
    }
  );
  res.redirect("/patients");
});
app.delete("/diagnosis/delete/:patient_id/:diagnosis_id", function (req, res) {
  Patient.findByIdAndUpdate(
    req.params.patient_id,
    {
      $pull: {
        history: { _id: req.params.diagnosis_id },
      },
    },
    function (err, result) {
      if (!err) {
        console.log(result);
      }
    }
  );

  Diagnosis.deleteOne({ _id: req.params.diagnosis_id }, function (err, result) {
    if (!err) {
      console.log(result);
    }
  });
  res.redirect("/patients");
});

// appointment
app.get("/appointment", function (req, res) {
  Appointment.find({},function(err,result){
    res.render("appointment/list", {result: result});
  })
});
app.post("/appointment", function (req,res){
  const appointment = new Appointment({
    title:req.body.title,
    start: req.body.startDate +" " +req.body.startTime,
    end: req.body.endDate +" " +req.body.endTime,
  });
  appointment.save();
  res.redirect("/appointment")
});


// medicine
app.get("/medicine", function(req,res){
  Medicine.find({},function(err,result){
    res.render("medicine/table",{result:result})
  })
})

app.put("/medicine", function(req,res){
  console.log(req.body)
  Medicine.updateOne({name:req.body.name},
  {type:req.body.type, description:req.body.description, stocks: req.body.stocks},
  function (err, result) {
    if (!err) {
      console.log(result);
    }
  })
  res.redirect("/medicine")
})
app.delete("/medicine",function(req,res){ 
  Medicine.deleteOne({name:req.body.delete}, function (err, result) {
    if (!err) {
      console.log(result);
    }
  }); 
  res.redirect("/medicine")
})

app.get("/medicine/new", function(req,res){
  res.render("medicine/new")
})
app.post("/medicine/new", function(req,res){
  const medicine = new Medicine({
    name: req.body.name,
    type: req.body.type,
    description: req.body.description,
    stocks: req.body.stocks
  })
  medicine.save()
  res.redirect("/medicine")

})


app.get("*", function (req, res) {
  res.render("404");
});
app.listen(3000, function () {
  console.log("Server Running");
});
