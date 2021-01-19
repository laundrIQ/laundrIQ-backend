import moment from "moment";

const getPastWeekdays = (weekday, amount) => {
    let days = [];
    let curr = moment().weekday(weekday);
    if (curr.isAfter()) {
        curr.add(-1, "week");
    }
    for (let i = 0; i < amount; i++) {
        days.push([curr.startOf("day").valueOf(), curr.endOf("day").valueOf()]);
        curr.add(-1, "week");
    }
    return days;
};

export {
    getPastWeekdays
}