const { generateAssignments } = require("../src/rudolph.js");

const assertAssignmentsAreValid = (assignments, participants) => {
  if (assignments.length !== participants.length) {
    throw new Error("Incorrect number of assignments.");
  }

  const santas = assignments.map((a) => a.santa);
  const kiddos = assignments.map((a) => a.kiddo);

  if (new Set(santas).size !== participants.length) {
    throw new Error("Santa names do not match participants.");
  }

  if (new Set(kiddos).size !== participants.length) {
    throw new Error("Kiddo names do not match participants.");
  }

  assignments.forEach((assignment) => {
    if (assignment.santa === assignment.kiddo) {
      throw new Error(`${assignment.santa} is assigned to themselves.`);
    }
  });
};

const testGenerateValidAssignments = async () => {
  const participants = [
    { Name: "Alice", "WhatsApp Name": "Alice W" },
    { Name: "Bob", "WhatsApp Name": "Bob Marley" },
    { Name: "Charlie", "WhatsApp Name": "Charlie (Chocolate Factory)" },
  ];

  const assignments = await generateAssignments(participants);
  assertAssignmentsAreValid(assignments, participants);
};

const testGenerateValidAssignmentsWithConstraints = async () => {
  const participants = [
    {
      Name: "Alice",
      "WhatsApp Name": "Alice W",
      "Avoid Kiddos": ["Bob"],
    },
    { Name: "Bob", "WhatsApp Name": "Bob Marley" },
    { Name: "Charlie", "WhatsApp Name": "Charlie (Chocolate Factory)" },
  ];

  const assignments = await generateAssignments(participants);
  assertAssignmentsAreValid(assignments, participants);
  const aliceAssignment = assignments.find((a) => a.santa === "Alice");
  if (aliceAssignment.kiddo === "Bob") {
    throw new Error(
      "Alice was assigned to Bob, which is a constraint violation.",
    );
  }
};

const testGenerateInvalidAssignmentsWithConstraints = async () => {
  const participants = [
    {
      Name: "Alice",
      "WhatsApp Name": "Alice W",
      "Avoid Kiddos": ["Bob", "Charlie"],
    },
    { Name: "Bob", "WhatsApp Name": "Bob Marley" },
    { Name: "Charlie", "WhatsApp Name": "Charlie (Chocolate Factory)" },
  ];

  try {
    await generateAssignments(participants);
  } catch (e) {
    if (!e.message.startsWith("Unsolvable constraints")) {
      throw e;
    }
  }
};

(async () => {
  await testGenerateValidAssignments();
  await testGenerateValidAssignmentsWithConstraints();
  await testGenerateInvalidAssignmentsWithConstraints();
  console.log("All tests passed.");
})();
