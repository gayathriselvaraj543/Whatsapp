export class User {
  constructor(name, id = cryptoRandomId()) {
    this.id = id;
    this.name = name;
  }
}

function cryptoRandomId() {
  // simple unique id for demo
  return Math.random().toString(36).slice(2, 10);
}
