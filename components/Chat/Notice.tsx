import { FC } from "react";

export const Notice: FC = () => {
    return (
        <div className="flex flex-col">
            <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
                Legal Notice
            </label>
            <div
                id="notice_section"
                className={`p-4 border border-neutral-300 dark:border-neutral-600 text-neutral-700 rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-y-auto transition-max-h duration-300`}
            >
                <ul>
                    <li>
                        <span>
                            If you are a litigation hold custodian, <b>do not input any information relating to a subject matter addressed in a litigation hold into the GovChat tool</b>. 
                            To determine if you are a litigation hold custodian and to review your litigation holds, access your personal Relativity Legal Hold (RLH) custodian portal by locating the most recent email
                            from <a href="mailto:EPA_Legal_Hold@epa.gov" title="mailto:EPA_Legal_Hold@epa.gov" className="underline">EPA_Legal_Hold@epa.gov</a> with
                            the subject line “Global Notice – Relativity Legal Hold Reminder” sent to you within the past 90 days. 
                            Follow the instructions in that email to access your RLH custodian portal. If you cannot locate that email or have any access issues,
                            send an email to <a href="mailto:EPA_Legal_Hold@epa.gov" title="mailto:EPA_Legal_Hold@epa.gov" className="underline">EPA_Legal_Hold@epa.gov</a>.
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}