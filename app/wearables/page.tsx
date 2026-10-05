import {requireUser} from "../../lib/auth";
import WearablesClient from "./WearablesClient";
export default async function WearablesPage(){await requireUser();return <WearablesClient/>}
