// test/electron-store.mock.js
class MockStore {
    constructor() {
        this.data = {
            widget: 'show',
            length: 'long',
            connect: true,
            connect_tunnel: {
                domain: "",
                authtoken: ""
            }
        };
    }

    get(key) {
        return this.data[key];
    }
    get(key, dflt) {
        return this.data[key] ?? dflt;
    }

    set(key, value) {
        this.data[key] = value;
    }

    delete(key) {
        delete this.data[key];
    }

    clear() {
        this.data = {};
    }
}

module.exports = MockStore;
