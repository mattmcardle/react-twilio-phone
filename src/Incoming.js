import React from "react";
import "./incoming.css";

const Incoming = ({ connection, device }) => {
  const acceptConnection = () => {
    connection.accept();
  };
  const rejectConnection = () => {
    connection.reject();
  };
  return (
    <div class="container">
      <h2 class="incoming">Incoming call from</h2>
      <h1>{connection.parameters.From}</h1>
      <div class="buttons">
      <button class="answer" onClick={acceptConnection}>Accept</button>
      <button class="reject" onClick={rejectConnection}>Reject</button>
      </div>
    </div>
  );
};

export default Incoming;
