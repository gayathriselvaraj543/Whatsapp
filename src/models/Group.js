export class Group {
  constructor(name, memberIds = []) {
    this.id = Math.random().toString(36).slice(2, 10);
    this.name = name;
    this.memberIds = memberIds;
    this.messages = [];
  }

  addMember(userId) {
    if (!this.memberIds.includes(userId)) this.memberIds.push(userId);
  }

  addMessage(m) { this.messages.push(m); }
}
