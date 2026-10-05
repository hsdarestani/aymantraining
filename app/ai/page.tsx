import {requireUser} from "../../lib/auth";
import AIClient from "./AIClient";
export default async function AIPage(){await requireUser();return <AIClient/>}
