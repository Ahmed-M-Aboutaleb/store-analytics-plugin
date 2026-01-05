import { asDateISOString } from "./date-range";

const formatDateInput = (date: Date) => asDateISOString(date).slice(0, 10);

export default formatDateInput;
