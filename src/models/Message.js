export class Message {
  constructor(senderId, content, type = 'text') {
    this.id = Math.random().toString(36).slice(2, 10);
    this.senderId = senderId;
    this.content = content;
    this.type = type;
    this.timestamp = Date.now();
  }
}
