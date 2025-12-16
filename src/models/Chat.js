export class Chat {
  constructor(participantIds = []) {
    this.id = chatIdFrom(participantIds);
    this.participantIds = participantIds;
    this.messages = [];
  }

  addMessage(m) { this.messages.push(m); }
}

function chatIdFrom(ids) {
  return ids.slice().sort().join('-');
}
