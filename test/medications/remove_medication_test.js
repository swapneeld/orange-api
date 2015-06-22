"use strict";
var chakram     = require("chakram"),
    curry       = require("curry"),
    Q           = require("q"),
    util        = require("util"),
    auth        = require("../common/auth.js"),
    fixtures    = require("./fixtures.js"),
    patients    = require("../patients/common.js"),
    common      = require("./common.js");

var expect = chakram.expect;

describe("Patients", function () {
    common.beforeEach();
    describe("Remove A Medication (DELETE /patients/:patientid/medications/:medicationid)", function () {
        // given a patient ID, medication ID and acces token, try and delete the medication
        var remove = function (medicationId, patientId, accessToken) {
            var url = util.format("http://localhost:3000/v1/patients/%d/medications/%d", patientId, medicationId);
            return chakram.delete(url, {}, auth.genAuthHeaders(accessToken));
        };

        patients.itRequiresAuthentication(curry(remove)(1));
        patients.itRequiresValidPatientId(curry(remove)(1));
        // helpers to create patient and medication
        var removeMyPatientMedication = function (data) {
            // add name if not present: see reasoning for this over fixtures in create test
            if (!("name" in data)) data.name = "foobar";

            return patients.testMyPatient({}).then(function (patient) {
                return Q.nbind(patient.createMedication, patient)(data).then(function (medication) {
                    return remove(medication._id, patient._id, patient.user.accessToken);
                });
            });
        };
        var removeOtherPatientMedication = function (access, data) {
            // add name if not present: see reasoning for this over fixtures in create test
            if (!("name" in data)) data.name = "foobar";

            return patients.testOtherPatient({}, access).then(function (patient) {
                return Q.nbind(patient.createMedication, patient)(data).then(function (medication) {
                    return remove(medication._id, patient._id, patient.user.accessToken);
                });
            });
        };

        it("should let me delete medications for my patients", function () {
            return expect(removeMyPatientMedication({})).to.be.a.medication.success;
        });
        it("should let me delete medications for patients shared read-write", function () {
            return expect(removeOtherPatientMedication("write", {})).to.be.a.medication.success;
        });
        it("should not let me delete medications for patients shared read-only", function () {
            return expect(removeOtherPatientMedication("read", {})).to.be.an.api.error(403, "unauthorized");
        });
        it("should not let me delete medications for patients not shared with me", function () {
            return expect(removeOtherPatientMedication("none", {})).to.be.an.api.error(403, "unauthorized");
        });
        it("should not let me delete medications for the wrong patient", function () {
            // setup current user and two patients for them, one with a medication
            var user, patient, otherPatient;
            var setup = auth.createTestUser().then(function (u) {
                user = u;
                // create patients
                return Q.all([
                    patients.createMyPatient({}, user),
                    patients.createMyPatient({}, user)
                ]).spread(function (p1, p2) {
                    patient = p1;
                    otherPatient = p2;
                }).then(function () {
                    // setup medication for otherPatient
                    return Q.nbind(otherPatient.createMedication, otherPatient)({ name: "foobar" });
                });
            });

            // check we can't access otherPatient's medication under patient
            var check = function () {
                var endpoint = remove(otherPatient.medications[0]._id, patient._id, user.accessToken);
                return expect(endpoint).to.be.an.api.error(404, "invalid_medication_id");
            };

            return setup.then(check);
        });
    });
});
