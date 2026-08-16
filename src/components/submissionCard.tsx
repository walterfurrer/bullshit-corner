import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { FormatDetails } from '#/lib/formatDetails'

type SubmissionCardProps = {
  topic: string
  details?: string
  submittedBy?: string
  submittedAt: number
}

export function SubmissionCard({
  topic,
  details,
  submittedBy,
}: SubmissionCardProps) {


  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border p-4 text-start">
      <h3 className="text-base font-semibold">{topic}</h3>

      {details ? (
        <Accordion defaultValue={[]}>
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="py-0 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
              Show details
            </AccordionTrigger>
            <AccordionContent>
              <FormatDetails text={details} className="text-sm text-muted-foreground" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          No description submitted.
        </p>
      )}

      <p className="text-xs text-muted-foreground" >{submittedBy ? `Submitted as ${submittedBy}` : 'Submitted anonymously'}</p>
    </article>
  )
}
