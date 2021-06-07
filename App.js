const express = require("express");
let ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");

mongoose.connect("mongodb://localhost:27017/clinicDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const app = express();

const patientSchema = {
  name: String,
  gender: String,
  birthdate: Date,
  address: String,
  history: [{ Date: Date, Diagnosis: String }],
};

const Patient = mongoose.model("patient", patientSchema);

app.set("view engine", "ejs");
app.use(express.static("public/"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("login");
});

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
app.get("/register-patient", function (req, res) {
  res.render("NewPatient");
});

app.post("/new-patient", function (req, res) {
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
  const diagnosis = { Date: "4/6/21", Diagnosis: req.body.diagnosis };
  Patient.findOneAndUpdate(
    { _id: req.body.id },
    { $push: { history: diagnosis } },
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

app.post("/delete-patient", function (req, res) {
  Patient.deleteOne({ _id: req.body.id }, function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log(success);
    }
  });
  res.redirect("/patients");
});

app.get("/patient-edit/:id", function (req, res) {
  Patient.findOne({ _id: req.params.id }, function (err, patient) {
    let birthdate = moment(patient.birthdate);
    birthdate = birthdate.format("YYYY-MM-DD");
    res.render("patient-edit", { patient: patient, birthdate: birthdate });
  });
});

app.post("/patient-edit", function (req, res) {
  Patient.updateOne(
    { _id: req.body.id },
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

app.get("*", function (req, res) {
  res.render("404");
});
app.listen(3000, function () {
  console.log("Server Running");
});
