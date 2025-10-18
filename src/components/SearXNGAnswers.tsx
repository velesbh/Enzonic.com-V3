import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Info, Lightbulb } from "lucide-react";
import type { SearXNGAnswer, SearXNGInfobox } from "@/lib/searxngApi";

interface SearXNGAnswersProps {
  answers: SearXNGAnswer[];
  infoboxes: SearXNGInfobox[];
}

export default function SearXNGAnswers({ answers, infoboxes }: SearXNGAnswersProps) {
  // Don't render if no answers or infoboxes
  if (answers.length === 0 && infoboxes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Instant Answers from SearXNG - Compact Sidebar Style */}
      {answers.map((answer, index) => (
        <Card key={index} className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Instant Answer</span>
              </div>
              
              {/* Answer Text */}
              <p className="text-sm leading-relaxed">{answer.answer}</p>
              
              {/* Learn More Link */}
              {answer.url && (
                <div className="pt-2 border-t">
                  <a
                    href={answer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Learn more <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Infoboxes from SearXNG - Compact Sidebar Style */}
      {infoboxes.map((infobox, index) => (
        <Card key={index} className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
                <div className="p-1.5 bg-blue-500/10 rounded-full">
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">{infobox.infobox}</span>
              </div>

              {/* Infobox image if available */}
              {infobox.img_src && (
                <div className="w-full">
                  <img
                    src={infobox.img_src}
                    alt={infobox.infobox}
                    className="w-full h-40 object-cover rounded-lg border shadow-sm"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Main content */}
              <p className="text-sm leading-relaxed text-muted-foreground">{infobox.content}</p>

              {/* Attributes (key-value pairs) */}
              {infobox.attributes && infobox.attributes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Details
                  </div>
                  <div className="space-y-1">
                    {infobox.attributes.map((attr, attrIndex) => (
                      <div key={attrIndex} className="text-xs">
                        <span className="font-medium text-foreground/80">{attr.label}:</span>{" "}
                        <span className="text-muted-foreground">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related URLs */}
              {infobox.urls && infobox.urls.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Related Links
                  </div>
                  <div className="flex flex-col gap-1">
                    {infobox.urls.slice(0, 3).map((urlItem, urlIndex) => (
                      <a
                        key={urlIndex}
                        href={urlItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {urlItem.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
