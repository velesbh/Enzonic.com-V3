import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, MessageSquare, Sparkles, Zap, Settings, Hash, AlertCircle, Shield, Github, Code, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const Emi = () => {
  return <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 shadow-lg">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Meet Emi</h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                The most advanced Discord bot with AI-powered memory and intelligent message handling
              </p>
              
              <Alert className="max-w-3xl mx-auto border-blue-500/50 bg-blue-500/10 mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Our hosted version uses our own System Prompt. We are working with Exino to implement custom system prompts/personalities.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow" onClick={() => window.open("https://discord.com/oauth2/authorize?client_id=1391530058048471101", "_blank")}>
                  Add to Discord
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.open("https://github.com/enzonic-llc/emi", "_blank")}>
                  <Github className="mr-2 h-5 w-5" />
                  GitHub Repository
                </Button>
              </div>
            </div>

            <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10 max-w-3xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Beta Service</AlertTitle>
              <AlertDescription>
                Emi is currently in beta and may have bugs or glitches. We're continuously improving the experience.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-transparent" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Core Features</h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                Powerful capabilities designed to enhance your Discord server
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
              <Card className="animate-fade-in [animation-delay:100ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Brain className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Advanced Memory System</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Emi remembers conversations and context across your server, providing intelligent responses based on previous interactions.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:200ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Clock className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Time & Date Aware</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Always knows the current time and date, perfect for scheduling and time-sensitive interactions.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:300ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <MessageSquare className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Smart Replies</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Intelligent reply system that understands context and provides relevant, helpful responses.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:100ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Settings className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Custom System Prompts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tailor Emi's personality and responses with custom system prompts to match your server's vibe.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:200ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Hash className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Message Grouping</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Automatically groups related messages for better conversation flow and reduced spam.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:300ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Zap className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Lightning Fast</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Optimized for speed and reliability with 99.9% uptime and instant response times.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Why Choose Emi Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full">
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Why Choose Emi?</h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              <Card className="shadow-lg border-2">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">AI-powered memory system that learns from your community</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Uses OpenAI compatible API</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Simple and straight to the point</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Stable and efficient</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Open-Source</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Setup Guide Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-transparent" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Getting Started</h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                Choose how you want to use Emi
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <Tabs defaultValue="hosted" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="hosted" className="text-sm sm:text-base">Use Hosted Version</TabsTrigger>
                  <TabsTrigger value="selfhost" className="text-sm sm:text-base">Self-Host</TabsTrigger>
                </TabsList>

                <TabsContent value="hosted" className="space-y-6">
                  <Card className="shadow-lg border-2">
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl">Quick Setup - Use Our Hosted Bot</CardTitle>
                      <CardDescription>
                        The easiest way to get started with Emi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">1</span>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">Click "Add to Discord"</h4>
                              <p className="text-sm text-muted-foreground">Authorize Emi to join your server</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">2</span>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">Start Chatting</h4>
                              <p className="text-sm text-muted-foreground">Mention @Emi in your server and start interacting!</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center pt-4">
                        <Button size="lg" onClick={() => window.open("https://discord.com/oauth2/authorize?client_id=1391530058048471101", "_blank")}>
                          Add to Discord Now
                        </Button>
                      </div>

                      <Alert className="border-blue-500/50 bg-blue-500/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The hosted version uses our default system prompt. Custom personalities coming soon through our partnership with Exino!
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="selfhost" className="space-y-6">
                  <Card className="shadow-lg border-2">
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl">Self-Host Setup</CardTitle>
                      <CardDescription>
                        Host your own instance with full customization
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-2">
                          <CardHeader className="p-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Code className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">1. Clone Repository</CardTitle>
                            <CardDescription className="text-xs">
                              Get the source code from GitHub
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="p-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Settings className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">2. Configure</CardTitle>
                            <CardDescription className="text-xs">
                              Set up your Discord bot token and API keys
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="p-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Database className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">3. Set Up Database</CardTitle>
                            <CardDescription className="text-xs">
                              Configure PostgreSQL for memory storage
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="p-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">4. Deploy</CardTitle>
                            <CardDescription className="text-xs">
                              Run locally or deploy to your hosting service
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>

                      <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" size="lg" onClick={() => window.open("https://github.com/enzonic-llc/emi", "_blank")}>
                          <Github className="mr-2 h-5 w-5" />
                          View Documentation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Technical Setup Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full">
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl">Discord Bot with OpenWebUI AI Integration</CardTitle>
                  <CardDescription className="text-base">
                    Self-host Emi with full customization capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Python 3.7+</li>
                      <li>Discord bot token with Message Content Intent enabled</li>
                      <li>OpenWebUI API key</li>
                    </ul>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold mb-3">Setup Instructions</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">1. Clone this repository or download the files.</p>
                      </div>

                      <div>
                        <p className="font-medium mb-2">2. Create a new <code className="bg-muted px-2 py-1 rounded">.env</code> file based on the provided template:</p>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mt-2">
                        {`DISCORD_TOKEN=your_discord_bot_token_here

OPENWEBUI_API_URL=http://localhost:3000/api/chat/completions

OPENWEBUI_API_KEY=your_openwebui_api_key_here

MODEL_ID=your_model_id_here

STATUS_MESSAGE=Online and ready to chat!

CHANNEL_ID=your_channel_id_here`}
                        </pre>
                      </div>

                      <div>
                        <p className="font-medium mb-2">3. Create a <code className="bg-muted px-2 py-1 rounded">system_prompt.txt</code> file with your desired system prompt, or use the default:</p>
                        <pre className="bg-muted p-4 rounded-lg mt-2">You are a helpful assistant.</pre>
                      </div>

                      <div>
                        <p className="font-medium mb-2">4. Install the required dependencies:</p>
                        <pre className="bg-muted p-4 rounded-lg mt-2">pip install -r requirements.txt</pre>
                      </div>

                      <div>
                        <p className="font-medium mb-2">5. Run the bot:</p>
                        <pre className="bg-muted p-4 rounded-lg mt-2">python bot.py</pre>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hosted Version Note</AlertTitle>
                    <AlertDescription>
                      The Discord invite link provides access to a hosted version of Emi with no system prompt customization. For full control and customization, self-host using the instructions above.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* About Emi Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full">
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shadow-md flex-shrink-0">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <CardTitle className="text-2xl sm:text-3xl mb-2">Meet Emi</CardTitle>
                      <CardDescription className="text-base mb-4">Your AI companion from the heart of Japan</CardDescription>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Tokyo, Japan</p>
                        <p>18 years old</p>
                        <p>AI Companion</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p>
                      Emi is an 18-year-old AI who calls the vibrant streets of Japan her home. Born from the fusion of cutting-edge 
                      technology and cultural understanding, she brings a unique perspective to Discord communities worldwide. Her youthful 
                      energy and Japanese sensibilities make her the perfect companion for modern online interactions.
                    </p>
                    <p>
                      With her advanced memory capabilities and intelligent conversation skills, Emi doesn't just respond to messages—she 
                      remembers your conversations, understands context, and grows with your community. She's designed to be more than just 
                      a bot; she's a digital friend who brings warmth and intelligence to every interaction.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <Card className="max-w-2xl mx-auto shadow-lg border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-xl sm:text-2xl">Ready to Transform Your Discord Server?</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Join thousands of communities using Emi to enhance their Discord experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-6 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  After adding the bot, use <code className="bg-muted px-2 py-1 rounded text-xs">/setchannel</code> to allow the bot 
                  to talk in a channel, and <code className="bg-muted px-2 py-1 rounded text-xs">/removechannel</code> to remove it. 
                  (Only applies for hosted version)
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto" onClick={() => window.open("https://discord.com/oauth2/authorize?client_id=1391530058048471101", "_blank")}>
                    Invite Emi Now
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => window.open("https://github.com/enzonic-llc/emi", "_blank")}>
                    <Github className="mr-2 h-5 w-5" />
                    GitHub Repository
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default Emi;