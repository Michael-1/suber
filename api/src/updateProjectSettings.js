const { taskCollection, userCollection, projectCollection } = require("./db");

module.exports = function(req, res) {
  const userDocRef = userCollection.doc(req.user);
  const adminPriviledge = userDocRef.get().then(function(doc) {
    if (doc.get("role") !== "admin") {
      return Promise.reject("Not admin");
    }
  });
  const pointNormaliser = Promise.all([
    taskCollection.get(),
    taskCollection.get(),
  ]).then(function(snapshot) {
    const numberOfUsers = snapshot[0].docs.length;
    let sum = 0;
    for (let task of snapshot[1].docs) {
      sum += task.get("effort") / task.get("frequency");
    }
    return numberOfUsers / sum;
  });
  Promise.all([adminPriviledge, pointNormaliser])
    .then(function(snapshot) {
      projectCollection
        .doc("parameters")
        .set({ pointNormaliser: snapshot[1] })
        .then(function() {
          res.sendStatus(204);
        });
    })
    .catch(function(err) {
      res.status(403);
      res.send(err);
    });
};