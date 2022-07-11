import { Rest, Web } from "../../index";

type Class = Rest | Web;

interface FScheckOptions {
    path: string;
    type?: FScheckType;
}
type FScheckType = 'dir' | 'file';

export {
    Class,
    FScheckOptions,
}