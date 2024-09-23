import { FC } from "react";

interface Props {
  isAdvancedOpen: Boolean;
}

export const Rules: FC<Props> = ({ isAdvancedOpen }) => {
return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        Rules of Behavior
      </label>
      <div
        id="rules_section"
        className={`p-4 border border-neutral-300 dark:border-neutral-600 text-neutral-700 rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-y-auto transition-max-h duration-300 ${
          isAdvancedOpen ? 'max-h-[200px]' : 'max-h-[500px]'
        }`}
      >
<p className="text-xs text-black/80">GenAI Rules dated September 2024</p>
<p>These rules of behavior apply to EPA employees, contractors,
subcontractors, grantees, and volunteers in the safe, secure, and
ethical use of EPA authorized GenAI technologies on EPA provided devices
and in the performance of their official duties. While these rules of
behavior highlight some areas of special concern, all EPA policies that
govern your work and work products apply to work products produced with
the assistance of GenAI.</p>
<p><strong><div className="underline text-center">Definitions</div></strong></p>
<p><strong>Generative Artificial Intelligence (GenAI)</strong> is an
artificial intelligence technology that allows users to create new
content, such as text, audio, imagery, or other data, in response to
user input.</p>
<p><strong>Public GenAI</strong> tools are services accessible via the
internet for which EPA has no direct role in the configuration of the
services. Public Gen AI tools include services which are free as well as
those which require payment for use.</p>
<p><strong>EPA Internal GenAI</strong> tools are configured to operate
within EPA’s security boundaries and safely and securely use non-public
information as input.</p>
<p><strong><div className="underline text-center">Public vs EPA Internal GenAI</div></strong></p>
<p><strong>Public GenAI —</strong> Public Gen AI pose risks and
vulnerabilities because such tools may store, share, or otherwise use
information provided as an input.</p>
<p>Public Gen AI may never be used with non-public information because
the tool may save your input and potentially share it with others.<br />
<br />
Non-public information includes, for example, information intended to be
draft, pre-decisional and deliberative, information falling within the
attorney work-product or attorney-client privileges, and other
information internal to EPA. Additionally, non-public information
includes, but is not limited to controlled unclassified information
(CUI) such as enforcement sensitive information, personally identifiable
information (PII), sensitive personally identifiable information (SPII),
materials protected by copyright or license, and confidential business
information (CBI).<br />
<br />
Inputting non-public information into Public Gen AI may in some
circumstances have the effect of waiving otherwise applicable privileges
and protections for such information in other contexts (e.g., in
litigation or in response to Freedom of Information Act requests). Never
input non-public information into publicly available services including
Public Gen AI tools, and only use Public Gen AI tools which are
authorized for use.</p>
<p>At this time, EPA personnel may not use standalone Public Gen AI
tools that generate content based on users’ inputted prompts (e.g.,
ChatGPT, DALL-E, etc.). Notwithstanding this prohibition, EPA personnel
may use online search engines (e.g., Google, Yahoo, etc.) which provide
search result summaries created with generative AI, as well as
generative AI features within existing EPA authorized platforms and
software, so long as users do not input non-public information into such
tools and otherwise follow the rules of behavior outlined in this
document.</p>
<p><strong>EPA Internal GenAI</strong> — Currently there are no EPA
Internal Gen AI tools available. However, EPA is configuring Internal
Gen AI tools, and they will be listed here when they become
available.</p>
<p><strong>Other EPA GenAI functionality</strong> Within existing EPA
authorized platforms and software, there may exist Generative AI
features. These rules of behavior apply to EPA’s staff use of these
features.</p>
<p><strong><div className="underline text-center">Rules that Apply to Public and EPA Internal
GenAI</div></strong></p>
<p>These rules of behavior apply to EPA employees, contractors,
subcontractors, grantees, and volunteers.</p>
<ul>
<li><p>Use only EPA authorized GenAI tools, listed above.</p></li>
<li><p>Follow all existing EPA IT/IM Directives, including Environmental
Information Quality and Security/Privacy Directives.</p></li>
<li><p>Ensure activities involving the use of GenAI are performed
according to the Scientific Integrity Policy requirements.</p></li>
<li><p>Ensure environmental information operations that involve the use
of GenAI are planned, implemented, documented, and assessed in
accordance with procedures described in an agency approved Quality
Assurance Project Plan.</p></li>
<li><p>Assume responsibility for the quality, objectivity, utility,
integrity, and reliability of the work product when GenAI is used to
assist in developing a work product.</p></li>
<li><p>Reduce or mitigate any errors, inaccuracies, and biases
introduced by using GenAI by:</p>
<ul>
<li><p>Transparently disclosing the use of GenAI in development of your
work products, for example by writing &quot;This work may contain elements
generated or assisted by AI technology;&quot;</p></li>
<li><p>Fact checking and verifying that GenAI sourced content used in
your work product is correct and without bias; and</p></li>
<li><p>Providing appropriate citations for any reused original
content.</p></li>
</ul></li>
</ul>
<p><strong><div className="underline text-center">Examples of Acceptable Uses of GenAI</div></strong></p>
<p>Following are examples of acceptable uses of GenAI technologies.
These examples are not intended to be comprehensive and assume the
verification of all content produced by GenAI tools by expert human
analysis.</p>
<ol type="1">
<li><p><strong>Developing Initial Drafts of Communication
Materials:</strong> GenAI technologies can assist in drafting both
internal and public-facing communications. All GenAI assisted
communications intended for public release must undergo rigorous vetting
by designated personnel for accuracy and appropriateness.</p></li>
<li><p><strong>Information Summarization:</strong> GenAI may be used to
condense information into summaries for internal knowledge sharing,
enabling efficient comprehension of extensive documents and reports.
Users should not assume that such summaries are always completely
comprehensive and should note that Gen AI-generated summaries may
contain biases or inaccuracies.</p></li>
<li><p><strong>Policy Development and Analysis:</strong> Use of GenAI to
support the creation and review of policy documents by providing
insights based on data analysis, historical information, and regulatory
frameworks. All policies developed in part using GenAI must undergo
rigorous vetting by designated personnel to reduce or mitigate any
errors, inaccuracies, or biases, and to ensure that humans are the
ultimate decisionmakers.</p></li>
<li><p><strong>Creativity and Brainstorming:</strong> GenAI can
facilitate brainstorming sessions and enhance creative processes by
providing new ideas, perspectives, and knowledge expansion.</p></li>
<li><p><strong>Training and Simulations:</strong> GenAI is instrumental
in assisting human experts to develop training materials and simulations
that can enhance learning experiences and provide varied scenarios for
employee development.</p></li>
<li><p><strong>Scientific Data Analysis:</strong> Using GenAI to analyze
scientific data, identify patterns and generate hypotheses.</p></li>
<li><p><strong>Environmental Monitoring:</strong> Use GenAI to assist in
the real-time analysis of environmental data, predictive modeling, and
simulation of ecological scenarios to inform decision-making.</p></li>
</ol>
<p><strong><div className="underline text-center">Examples of Unacceptable Uses of GenAI</div></strong></p>
<p>Following are examples of unacceptable uses of AI technologies. These
examples are not intended to be exhaustive.</p>
<ol type="1">
<li><p><strong>Inherently Governmental Functions &amp;
Decisions:</strong> GenAI may never be used as the sole performer of an
inherently governmental function or decision-maker in any EPA-related
activities. Examples include final selection decisions in a hiring
action; final scoring of a grant application; final selection of a
contract awardee; final determinations in permitting, compliance or
enforcement actions.</p></li>
<li><p><strong>Handling of Non-Public Information:</strong> Inputting or
processing non-public information, as defined above, in GenAI
technologies is strictly prohibited unless the system is an EPA Internal
GenAI technology specifically authorized for this use. All EPA Internal
Gen AI systems will be listed above when they are authorized for
use.</p></li>
<li><p><strong>Misinformation:</strong> Using GenAI to create false or
misleading content or alter original artifacts that are represented to
be original is strictly prohibited.</p></li>
<li><p><strong>Bias and Discrimination</strong>: Using GenAI to create
biased information or altering original artifacts to produce biased
information that is represented to be not biased is strictly
prohibited.</p></li>
</ol>
<p><strong><div className="underline text-center">Policy References</div></strong></p>
<p>This guidance is grounded in EPA and federal policy, laws and
regulations governing the use of information technology and AI,
including but not limited to:</p>
<ul>
<li><p><a
href="https://www.congress.gov/107/plaws/publ347/PLAW-107publ347.pdf">E-Government
Act of 2002, Public Law 107-347, Title III, Federal Information Security
Management Act as amended December 17, 2002</a></p></li>
<li><p><a
href="https://www.congress.gov/bill/113th-congress/senate-bill/2521">Federal
Information Security Modernization Act of 2014, Public Law Public Law
No: 113-283 (December 18, 2014) (To amend chapter 35 of title 44, United
States Code, Form Rev. June 18, 2019)</a></p></li>
<li><p><a
href="https://www.federalregister.gov/documents/2020/12/08/2020-27065/promoting-the-use-of-trustworthy-artificial-intelligence-in-the-federal-government">Executive
Order 13960 “Promoting the Use of Trustworthy Artificial Intelligence in
the Federal Government” December 3, 2020</a></p></li>
<li><p><a
href="https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence">Executive
Order 14110 “Safe, Secure, and Trustworthy Development and Use of
Artificial Intelligence” October 30, 2023</a></p></li>
<li><p><a
href="https://obamawhitehouse.archives.gov/sites/default/files/omb/assets/omb/memoranda/fy2006/m06-19.pdf">OMB
Memorandum 06-19 “Reporting Incidents Involving Personally Identifiable
Information and Incorporating the Cost for Security in Agency
Information Technology Investments” July 12, 2006</a></p></li>
<li><p><a
href="https://georgewbush-whitehouse.archives.gov/omb/memoranda/fy2008/m08-21.pdf">OMB
Memorandum 08-21 “FY 2008 Reporting Instructions for the Federal
Information Security Management Act and Agency Privacy Management” July
14, 2008</a></p></li>
<li><p><a
href="https://www.whitehouse.gov/wp-content/uploads/2024/03/M-24-10-Advancing-Governance-Innovation-and-Risk-Management-for-Agency-Use-of-Artificial-Intelligence.pdf">OMB
Memorandum 24-10 “Advancing Governance, Innovation, and Risk Management
for Agency Use of Artificial Intelligence” March 28, 2024</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2023-12/information_security_program_management_procedure.pdf">CIO
2150-P-23.2 EPA Information Security – Program Management Procedure
December 19, 2023</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2024-02/information_security_policy.pdf">CIO
2150.6 EPA Information Security Policy February 1, 2024</a><br />
<a
href="https://www.epa.gov/system/files/documents/2024-04/information_security_epa_national_rules_of_behavior.pdf">CIO
2150-S-21.1 EPA Information Security – National Rules of Behavior April
10, 2024</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2022-05/information_security_roles_and_responsibilities_procedures.pdf">CIO-2150.3-P-19.2
EPA Information Security – Roles and Responsibilities Procedures May 19,
2022</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2022-09/limited_personal_use_of_government_office_equipment_policy.pdf">CIO
2101.2 EPA Limited Personal Use of Government Office Equipment Policy
September 13, 2022</a></p></li>
<li><p><a
href="https://www.epa.gov/sites/default/files/2015-09/documents/2151.1.pdf">CIO
2151.0 EPA Privacy Policy September 14, 2018</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2024-07/controlled_unclassified_information_policy.pdf">CIO
2158.1 EPA Controlled Unclassified Information Policy July 10,
2024</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2023-04/environmental_information_quality_policy.pdf">CIO
2105.4 EPA Environmental Information Quality Policy April 10,
2023</a></p></li>
<li><p><a
href="https://www.epa.gov/system/files/documents/2023-12/scientific_integrity_policy_2012_accessible.pdf">EPA
Scientific Integrity Policy 2012</a></p></li>
<li><p><a
href="https://www.cio.gov/policies-and-priorities/circular-a-130/">OMB
Circular No. A-130 - Managing Information as a Strategic Resource July
2016</a></p></li>
</ul>

      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Your conversations using this tool are recorded.</p>
    </div>
  );
}