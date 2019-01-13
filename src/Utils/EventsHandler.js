const handlers = {};

export default class EventsHandler {
    static on (name, method) {
        if(!handlers.hasOwnProperty(name))
            handlers[name] = []
        handlers[name].push(method);
    }

    static fire(name, ...rest) {
        if(handlers.hasOwnProperty(name)) {
            handlers[name].forEach(method => method.apply(null, rest));
        }
    }

}