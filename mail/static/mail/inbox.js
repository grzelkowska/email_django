document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // send email
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

const load_mailbox = async (mailbox) => {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  await fetch(`/emails/${mailbox}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        console.log(email);
        const mail = document.createElement("div");
        mail.className = "mail";
        if (mailbox === "inbox") {
          mail.innerHTML = `Sender: ${email.sender} &nbsp; Subject: ${email.subject} &emsp; Date: ${email.timestamp}`;
        } else if (mailbox === "sent") {
          mail.innerHTML = `Recipients: ${email.recipients} &nbsp; Subject: ${email.subject} &emsp; Date: ${email.timestamp}`;
        } else if (mailbox === "archive") {
          mail.innerHTML = `Sender: ${email.sender} &nbsp; Recipients: ${email.recipients} <br> Subject: ${email.subject} &emsp; Date: ${email.timestamp}`;
        }

        mail.addEventListener("click", async () => {
          view_email(email.id, mailbox);

          await fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true,
            }),
          });
        });
        if (email.read === true) {
          mail.style.background = "lightgrey";
        } else {
          mail.style.background = "white";
        }
        // const br =  document.createElement('hr')
        mail.style.border = "solid grey"
        document.querySelector("#emails-view").appendChild(mail);
        // document.querySelector("#emails-view").appendChild(br);
      });
    });
};

const view_email = async (email_id, mailbox) => {
  const email_view = document.querySelector("#email-view");
  email_view.innerHTML = "";

  const sender = document.createElement("div");
  const recipients = document.createElement("div");
  const subject = document.createElement("div");
  const body = document.createElement("p");
  body.style = "white-space: pre-line";
  const timestamp = document.createElement("div");

  const archive_button = document.createElement("button");
  const reply_button = document.createElement("button");
  reply_button.innerHTML = "Reply";

  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";

  await fetch(`/emails/${email_id}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((email) => {
      sender.innerHTML = `Sender: ${email.sender}`;
      recipients.innerHTML = `Recipients: ${email.recipients}`;
      subject.innerHTML = `Subject: ${email.subject}<hr>`;
      body.innerHTML = `${email.body}`;
      timestamp.innerHTML = `${email.timestamp}`;

      email_view.append(
        sender,
        recipients,
        subject,
        body,
        timestamp,
        reply_button
      );

      if (mailbox !== "sent") {
        email_view.append(archive_button);
      }
      if (email.archived === false) {
        archive_button.innerHTML = "Archive";
      } else if (email.archived === true) {
        archive_button.innerHTML = "Unarchive";
      }

      archive_button.addEventListener("click", async () => {
        if (email.archived === false) {
          await fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: true,
            }),
          });
        } else {
          await fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: false,
            }),
          });
        }
        load_mailbox("inbox");
      });

      reply_button.addEventListener("click", () => {
        compose_email();
        document.querySelector("#compose-recipients").value = `${email.sender}`;
        if (!email.subject.startsWith("Re:")) {
          document.querySelector(
            "#compose-subject"
          ).value = `Re: ${email.subject}`;
        } else {
          document.querySelector("#compose-subject").value = `${email.subject}`;
        }
        document.querySelector(
          "#compose-body"
        ).value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}\n\n`;
      });
    });
};

const send_email = async (event) => {
  event.preventDefault();
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;
  console.log(recipients, subject, body);

  await fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients,
      subject,
      body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
    });

  load_mailbox("sent");
};
