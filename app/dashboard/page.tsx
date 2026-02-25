import { ArrowUpRight, Plus, HelpCircle, MessageCircle, Settings, Paperclip, Smile, Calendar, Check, SlidersHorizontal, Folder, Target, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Page() {
  // Generate random heatmap data for the Contribution grid
  const heatmapData = Array.from({ length: 7 * 20 }).map((_, i) => {
    const intensity = Math.random();
    if (intensity > 0.8) return 'bg-primary';
    if (intensity > 0.5) return 'bg-primary/60';
    if (intensity > 0.2) return 'bg-primary/30';
    return 'bg-muted';
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Good morning, Mike!</h2>
          <p className="text-muted-foreground mt-1 text-sm">Let's make this day productive.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">Tasks done <ArrowUpRight className="size-3" /></span>
            <div className="text-xl font-bold text-foreground mt-0.5">2,543</div>
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">Hours saved <ArrowUpRight className="size-3" /></span>
            <div className="text-xl font-bold text-foreground mt-0.5">82%</div>
          </div>
          <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 ml-2 hidden sm:flex font-semibold text-xs border-none">
            <Plus className="mr-1 size-4" /> Add task
          </Button>
        </div>
      </div>

      {/* Grid Layout Row 1: 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Target Card */}
        <div className="col-span-1 shadow-sm bg-card rounded-2xl p-5 flex flex-col justify-between border-transparent">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm text-foreground">Goal Target</h3>
              <p className="text-xs text-muted-foreground mt-0.5">This Month</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Target className="size-4" /></div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-2 font-semibold">
              <span className="text-foreground">84%</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 shadow-inner">
              <div className="bg-primary h-2 rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="col-span-1 shadow-sm bg-card rounded-2xl p-5 flex flex-col border-transparent">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">Recent Projects</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Updated recently</p>
            </div>
            <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:bg-muted rounded-full"><Plus className="size-4" /></Button>
          </div>
          <div className="space-y-4 mt-auto">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-chart-1/20 text-chart-1 rounded-lg"><Folder className="size-3.5" /></div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Landing Page V2</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Updated 2h ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-chart-2/20 text-chart-2 rounded-lg"><Folder className="size-3.5" /></div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Mobile App UI</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Updated 5h ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Heatmap */}
        <div className="col-span-1 md:col-span-2 shadow-sm bg-card rounded-2xl p-5 flex flex-col overflow-hidden border-transparent">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Contributions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">853 activities in the last year</p>
            </div>
            <div className="p-2 bg-muted rounded-xl text-muted-foreground"><Activity className="size-4" /></div>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-2 overflow-x-auto no-scrollbar">
            <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
              {heatmapData.map((colorClass, idx) => (
                <div key={idx} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] ${colorClass}`}></div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium w-full min-w-[300px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Chat Widget */}
        <div className="col-span-1 shadow-sm bg-muted/50 rounded-[1.25rem] p-5 flex flex-col min-h-[300px] border-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex bg-card rounded-full p-1 shadow-xs">
              <div className="p-1.5 rounded-full cursor-pointer hover:bg-muted text-muted-foreground"><HelpCircle className="size-3.5" /></div>
              <div className="p-1.5 rounded-full bg-background shadow-xs text-foreground cursor-pointer"><MessageCircle className="size-3.5" /></div>
              <div className="p-1.5 rounded-full cursor-pointer hover:bg-muted text-muted-foreground"><Settings className="size-3.5" /></div>
            </div>
            <div className="ml-auto">
              <Avatar className="size-8 shadow-sm">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pr-1 mt-2">
            <div className="bg-card rounded-xl rounded-tl-sm p-3 shadow-sm max-w-[90%] border-transparent">
              <p className="text-xs leading-relaxed text-foreground">Hi there! I'm a virtual assistant.<br />How can I help you today?</p>
              <span className="text-[9px] text-muted-foreground block text-right mt-1.5 font-medium">9:32</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <Input className="rounded-full bg-card shadow-sm pr-16 h-10 pl-4 text-xs placeholder:text-xs border-transparent focus-visible:ring-1" placeholder="Write a message" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Paperclip className="size-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              <Smile className="size-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </div>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="col-span-1 md:col-span-2 shadow-sm bg-card rounded-2xl p-5 xl:p-6 flex flex-col relative min-h-[300px] overflow-hidden overflow-x-auto border-transparent">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="font-bold text-sm text-foreground">My activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">What is waiting for you today</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted/60 size-8">
              <Calendar className="size-4 text-foreground" />
            </Button>
          </div>

          <div className="relative flex-1 min-w-[400px] w-full mt-2">
            {/* Timeline markers */}
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-3 pr-2">
              <span>08:00</span>
              <span>09:00</span>
              <span>10:00</span>
              <span>11:00</span>
              <span className="text-foreground font-bold">12:00</span>
              <span>01:00</span>
            </div>

            {/* Vertical lines */}
            <div className="absolute top-6 bottom-0 left-0 right-0 flex justify-between px-2">
              <div className="w-px h-full border-l border-dashed border-border/60"></div>
              <div className="w-px h-full border-l border-dashed border-border/60"></div>
              <div className="w-px h-full border-l border-dashed border-border/60"></div>
              <div className="w-px h-full border-l border-dashed border-border/60"></div>
              <div className="w-px h-full border-l border-solid border-foreground relative bg-foreground">
                <div className="absolute -top-1 -left-1 size-2 border-2 border-background rounded-full bg-foreground"></div>
              </div>
              <div className="w-px h-full border-l border-dashed border-border/60"></div>
            </div>

            {/* Events */}
            <div className="relative h-full mt-2">
              {/* Event 1 */}
              <div className="absolute top-1 left-[5%] w-[35%] bg-chart-3 text-background rounded-xl p-2 flex justify-between items-center z-10 border-transparent shadow-sm">
                <div>
                  <h4 className="font-semibold text-xs">Project onboarding</h4>
                  <p className="text-[9px] opacity-90 mt-0.5">Google Meet</p>
                </div>
                <Avatar className="size-6 border-2 border-chart-3"><AvatarImage src="https://github.com/shadcn.png" /></Avatar>
              </div>

              {/* Event 2 */}
              <div className="absolute top-14 left-[40%] w-[40%] bg-muted rounded-xl p-2 flex justify-between items-center z-10 border-transparent shadow-sm">
                <div>
                  <h4 className="font-semibold text-xs text-foreground">Design research</h4>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Figma file</p>
                </div>
                <div className="size-6 rounded-full border-2 border-muted bg-foreground text-background flex items-center justify-center text-[8px] font-bold">+5</div>
              </div>

              {/* Event 3 */}
              <div className="absolute top-[100px] left-[70%] w-[30%] bg-chart-1 text-background rounded-xl p-2 flex justify-between items-center z-20 shadow-sm border-transparent">
                <div>
                  <h4 className="font-semibold text-xs">Coffee break</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* To-do List */}
        <div className="col-span-1 shadow-sm bg-muted/50 rounded-[1.25rem] p-5 flex flex-col min-h-[300px] border-transparent">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">To-do list</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Wed, 11 May</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-card size-8 shadow-xs border-transparent">
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border-transparent">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-foreground line-through decoration-muted-foreground/50 text-xs">Client Review</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Landing page reskin</p>
              </div>
              <div className="rounded-full bg-chart-1/20 p-1 flex items-center justify-center size-5">
                <Check className="size-3 text-chart-1" strokeWidth={3} />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-[9px] text-muted-foreground font-semibold border-t border-border/50 pt-3">
              <span>Today 10:00 PM</span>
              <div className="flex -space-x-1.5">
                <Avatar className="size-5 border-2 border-card"><AvatarImage src="https://github.com/shadcn.png" /></Avatar>
                <Avatar className="size-5 border-2 border-card"><AvatarFallback className="bg-primary text-primary-foreground text-[7px]">IN</AvatarFallback></Avatar>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Chart */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 shadow-sm bg-card rounded-2xl p-5 min-h-[220px] flex flex-col border-transparent">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-sm text-foreground">Summary Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Track your velocity</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 size-8 hover:bg-muted border-transparent">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full relative mt-2 min-h-[140px]">
            {/* Chart Background Grid */}
            <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-1 z-0">
              <div className="w-full border-t border-border/40"></div>
              <div className="w-full border-t border-border/40 relative"><span className="absolute -top-2.5 bg-card pr-1.5 text-[10px] font-semibold text-muted-foreground">300</span></div>
              <div className="w-full border-t border-border/40 relative"><span className="absolute -top-2.5 bg-card pr-1.5 text-[10px] font-semibold text-muted-foreground">200</span></div>
              <div className="w-full border-t border-border/40 relative"><span className="absolute -top-2.5 bg-card pr-1.5 text-[10px] font-semibold text-muted-foreground">100</span></div>
            </div>

            {/* SVG Chart Line Dummy */}
            <svg className="absolute inset-0 w-full h-full pt-2 pb-1 z-10" preserveAspectRatio="none" viewBox="0 0 1000 100">
              <path d="M0,90 Q150,70 250,90 T500,60 T700,20 T850,50 T1000,10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground" />
              <circle cx="700" cy="20" r="4" className="fill-chart-1 stroke-chart-1" />
              <circle cx="500" cy="60" r="3" className="fill-background stroke-foreground stroke-2" />
              <circle cx="850" cy="50" r="3" className="fill-background stroke-foreground stroke-2" />
            </svg>

            {/* Chart Tooltip popup matching image */}
            <div className="absolute top-[12%] left-[68%] transform -translate-x-1/2 p-1 px-2 bg-foreground text-background text-[10px] font-bold rounded-md shadow-md z-20">
              203
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
