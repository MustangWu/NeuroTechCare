import { useState } from "react";
import { Navigation } from "../components/Navigation";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Brain,
  Heart,
  Users,
  Shuffle,
  BookOpen,
  ExternalLink,
} from "lucide-react";

type Audience = "dementia" | "carer";

interface Flashcard {
  id: number;
  category: string;
  question: string;
  answer: string;
  tip?: string;
  source: string;
  sourceUrl: string;
  audience: Audience[];
}

const FLASHCARDS: Flashcard[] = [
  // --- Brain health / risk reduction (both) ---
  {
    id: 1,
    category: "Physical Activity",
    question: "How does regular physical activity protect your brain?",
    answer:
      "Exercise increases blood flow to the brain, promotes the growth of new brain cells, and reduces inflammation. Even 30 minutes of moderate activity (like brisk walking) most days can lower dementia risk by up to 35%.",
    tip: "Start with short 10-minute walks and gradually build up.",
    source: "Dementia Australia – Reduce Your Risk",
    sourceUrl: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia",
    audience: ["dementia", "carer"],
  },
  {
    id: 2,
    category: "Healthy Eating",
    question: "Which dietary pattern is best for brain health?",
    answer:
      "A Mediterranean-style diet rich in vegetables, fruits, whole grains, fish, and olive oil is associated with slower cognitive decline. Limiting processed foods, saturated fats, and added sugar also helps protect brain function.",
    tip: "Add an extra serving of leafy greens to your meals each day.",
    source: "Dementia Australia – Reduce Your Risk",
    sourceUrl: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia",
    audience: ["dementia", "carer"],
  },
  {
    id: 3,
    category: "Sleep",
    question: "Why is quality sleep critical for brain health?",
    answer:
      "During sleep, the brain's glymphatic system clears toxic proteins linked to Alzheimer's. Poor sleep (less than 6 hours or interrupted sleep) is associated with a higher risk of cognitive decline over time.",
    tip: "Aim for 7–9 hours of sleep per night and keep consistent bed/wake times.",
    source: "Dementia Australia – How do we maintain a healthy brain?",
    sourceUrl: "https://www.dementia.org.au/news/how-do-we-maintain-healthy-brain",
    audience: ["dementia", "carer"],
  },
  {
    id: 4,
    category: "Social Connection",
    question: "How does staying socially connected reduce dementia risk?",
    answer:
      "Strong social ties stimulate multiple brain regions, reduce stress hormones, and build cognitive reserve. Loneliness and social isolation are linked to a 26% increased risk of dementia.",
    tip: "Schedule regular catch-ups — phone calls, group activities, or community clubs all count.",
    source: "Dementia Australia – Reduce Your Risk",
    sourceUrl: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia",
    audience: ["dementia", "carer"],
  },
  {
    id: 5,
    category: "Mental Stimulation",
    question: "What types of activities build cognitive reserve?",
    answer:
      "Learning new skills, reading, puzzles, music, and lifelong education all help build cognitive reserve — the brain's resilience to damage. Challenging the brain regularly creates new neural pathways.",
    tip: "Try something new each week: a language app, a craft, or a new recipe.",
    source: "Dementia Australia – BrainTrack",
    sourceUrl: "https://www.dementia.org.au/braintrack",
    audience: ["dementia", "carer"],
  },
  {
    id: 6,
    category: "Heart Health",
    question: "What is the link between heart health and brain health?",
    answer:
      "What is good for the heart is good for the brain. High blood pressure, high cholesterol, diabetes, and obesity all increase dementia risk. Managing these conditions through lifestyle and medication keeps blood vessels healthy.",
    tip: "Get regular health checks and monitor your blood pressure at home.",
    source: "Dementia Australia – Reduce Your Risk",
    sourceUrl: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia",
    audience: ["dementia", "carer"],
  },
  {
    id: 7,
    category: "Personalised Plans",
    question: "Can personalised lifestyle plans lower dementia risk?",
    answer:
      "Research suggests tailored multi-domain interventions (addressing diet, exercise, cognition, and vascular risk together) are more effective than single strategies. Tools like BrainTrack help individuals identify their own risk factors and act on them.",
    tip: "Use Dementia Australia's BrainTrack tool to create your personalised brain health plan.",
    source: "Dementia Australia – Personalised Lifestyle Plans",
    sourceUrl: "https://www.dementia.org.au/news/could-personalised-lifestyle-plans-reduce-dementia-risk",
    audience: ["dementia", "carer"],
  },

  // --- Living with Dementia ---
  {
    id: 8,
    category: "Daily Routine",
    question: "How does a consistent daily routine help someone living with dementia?",
    answer:
      "Predictable routines reduce anxiety and confusion by making the day easier to navigate. Familiar activities activate long-term memory and provide a sense of purpose and control.",
    tip: "Keep meals, activities, and bedtimes at the same time each day.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["dementia"],
  },
  {
    id: 9,
    category: "Staying Active",
    question: "What types of physical activity are suitable for people living with dementia?",
    answer:
      "Gentle activities like walking, chair-based exercises, gardening, and dancing are safe and beneficial. Movement improves mood, reduces agitation, promotes better sleep, and slows functional decline.",
    tip: "Choose activities that were enjoyable before diagnosis — familiarity makes engagement easier.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["dementia"],
  },
  {
    id: 10,
    category: "Meaningful Activities",
    question: "Why are meaningful activities important for brain health with dementia?",
    answer:
      "Engaging in activities that hold personal meaning — like music, art, cooking, or reminiscing — stimulates the brain, enhances emotional wellbeing, and supports identity and dignity.",
    tip: "Create a 'memory box' of favourite photos, objects, or music to spark joyful engagement.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["dementia"],
  },
  {
    id: 11,
    category: "Stress & Wellbeing",
    question: "How can stress management support brain health in dementia?",
    answer:
      "Chronic stress raises cortisol levels that can damage brain cells. Mindfulness, gentle breathing, time in nature, and creative activities all help reduce stress and improve quality of life.",
    tip: "Practice 5 minutes of slow, deep breathing in the morning and before bed.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["dementia"],
  },
  {
    id: 12,
    category: "Nutrition",
    question: "What nutrition tips matter most for people living with dementia?",
    answer:
      "Staying well-hydrated and eating regular, balanced meals helps maintain energy and concentration. Finger foods or simplified meals can support independence when cutlery becomes challenging.",
    tip: "Offer small, frequent meals with bright colours to stimulate appetite.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["dementia"],
  },

  // --- For Carers ---
  {
    id: 13,
    category: "Carer Wellbeing",
    question: "Why must carers prioritise their own brain health?",
    answer:
      "Caregiver stress is a significant risk factor for their own cognitive decline and burnout. Looking after your own physical and mental health means you can provide better, more sustainable care for your loved one.",
    tip: "Seek respite care regularly — even short breaks restore your capacity to care.",
    source: "Dementia Australia – Reduce Your Risk",
    sourceUrl: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia",
    audience: ["carer"],
  },
  {
    id: 14,
    category: "Communication",
    question: "How can carers support positive brain engagement through communication?",
    answer:
      "Using calm, simple language, maintaining eye contact, and allowing extra time for responses keeps the person engaged. Reminiscing about positive memories stimulates multiple brain areas and strengthens your relationship.",
    tip: "Ask open-ended 'feeling' questions rather than fact-testing questions.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["carer"],
  },
  {
    id: 15,
    category: "Activity Planning",
    question: "How can carers create brain-healthy activities at home?",
    answer:
      "Incorporate gentle cognitive stimulation into everyday tasks: sorting items, watering plants, folding laundry, or listening to favourite music. Shared activities build connection and provide gentle mental exercise.",
    tip: "Follow the person's lead — activities that feel enjoyable will be most beneficial.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["carer"],
  },
  {
    id: 16,
    category: "Environment",
    question: "How does a safe, stimulating environment support brain health?",
    answer:
      "Good lighting, reduced clutter, calming colours, and familiar objects help reduce confusion and anxiety. Access to outdoor spaces and natural light supports circadian rhythm, sleep quality, and mood.",
    tip: "Label cupboards and rooms with simple words or pictures to promote independence.",
    source: "Dementia Australia – Brain Health Habits When Living with Dementia",
    sourceUrl: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia",
    audience: ["carer"],
  },
  {
    id: 17,
    category: "Support Networks",
    question: "What support resources are available for carers of people with dementia?",
    answer:
      "Dementia Australia offers a free National Dementia Helpline (1800 100 500), carer support groups, online resources, and education programs. Connecting with others who understand your experience reduces isolation.",
    tip: "Call the National Dementia Helpline — it is free, confidential, and available 24/7.",
    source: "Dementia Australia – BrainTrack",
    sourceUrl: "https://www.dementia.org.au/braintrack",
    audience: ["carer"],
  },
];

const CATEGORIES = ["All", "Physical Activity", "Healthy Eating", "Sleep", "Social Connection", "Mental Stimulation", "Heart Health", "Personalised Plans", "Daily Routine", "Staying Active", "Meaningful Activities", "Stress & Wellbeing", "Nutrition", "Carer Wellbeing", "Communication", "Activity Planning", "Environment", "Support Networks"];

const CATEGORY_ICONS: Record<string, string> = {
  "Physical Activity": "🏃",
  "Healthy Eating": "🥗",
  "Sleep": "😴",
  "Social Connection": "🤝",
  "Mental Stimulation": "🧩",
  "Heart Health": "❤️",
  "Personalised Plans": "📋",
  "Daily Routine": "🗓️",
  "Staying Active": "🚶",
  "Meaningful Activities": "🎨",
  "Stress & Wellbeing": "🌿",
  "Nutrition": "🍎",
  "Carer Wellbeing": "💙",
  "Communication": "💬",
  "Activity Planning": "✅",
  "Environment": "🏡",
  "Support Networks": "🤲",
};

export function BrainHealthFlashcards() {
  const [audience, setAudience] = useState<Audience>("dementia");
  const [category, setCategory] = useState("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [cardOrder, setCardOrder] = useState<number[]>([]);

  const filtered = FLASHCARDS.filter(
    (c) =>
      c.audience.includes(audience) &&
      (category === "All" || c.category === category)
  );

  const orderedCards =
    isShuffled && cardOrder.length === filtered.length
      ? cardOrder.map((i) => filtered[i]).filter(Boolean)
      : filtered;

  const safeIndex = Math.min(currentIndex, Math.max(orderedCards.length - 1, 0));
  const card = orderedCards[safeIndex];

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    setIsFlipped(false);
  };

  const prev = () => goTo(Math.max(0, safeIndex - 1));
  const next = () => goTo(Math.min(orderedCards.length - 1, safeIndex + 1));

  const shuffle = () => {
    const indices = filtered.map((_, i) => i).sort(() => Math.random() - 0.5);
    setCardOrder(indices);
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const reset = () => {
    setIsShuffled(false);
    setCardOrder([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAudienceChange = (a: Audience) => {
    setAudience(a);
    setCategory("All");
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setCardOrder([]);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setCardOrder([]);
  };

  const availableCategories = CATEGORIES.filter((cat) => {
    if (cat === "All") return true;
    return FLASHCARDS.some((c) => c.audience.includes(audience) && c.category === cat);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#2d5a8f]" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Get a Quiz</h1>
          </div>
          <p className="text-gray-600 text-sm mb-4 max-w-2xl">
            These evidence-based flashcards are designed to support brain health awareness for everyone involved in dementia care. Tap any card to reveal the answer and discover practical tips you can use today.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mb-2">
            <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-[#2d5a8f]" />
                <span className="text-sm font-medium text-[#2d5a8f]">People Living with Dementia</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Learn evidence-based strategies to maintain independence, stay active, and support your quality of life at every stage.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Carers &amp; Supporters</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Discover practical communication tips, activity ideas, and wellbeing strategies to help you provide the best possible care — while looking after yourself too.
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            Content sourced from{" "}
            <a
              href="https://www.dementia.org.au/braintrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2d5a8f] hover:underline inline-flex items-center gap-1"
            >
              Dementia Australia <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Audience Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex flex-wrap gap-1 mb-6 w-fit">
          <button
            onClick={() => handleAudienceChange("dementia")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              audience === "dementia"
                ? "bg-[#2d5a8f] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Brain className="w-4 h-4" />
            Living with Dementia
          </button>
          <button
            onClick={() => handleAudienceChange("carer")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              audience === "carer"
                ? "bg-[#2d5a8f] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Heart className="w-4 h-4" />
            For Carers & Supporters
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  category === cat
                    ? "bg-[#2d5a8f] text-white border-[#2d5a8f]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2d5a8f] hover:text-[#2d5a8f]"
                }`}
              >
                {cat !== "All" && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 80 / 20 layout — stacks on mobile */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left — flashcard area */}
          <div className="flex-[8] min-w-0 w-full">
            {orderedCards.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400">
                No flashcards in this category for the selected audience.
              </div>
            ) : (
              <>
                {/* Progress & Actions */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    Card{" "}
                    <span className="font-semibold text-gray-800">{safeIndex + 1}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-800">{orderedCards.length}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={shuffle}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-[#2d5a8f] hover:text-[#2d5a8f] transition-all"
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Shuffle
                    </button>
                    {isShuffled && (
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-[#2d5a8f] hover:text-[#2d5a8f] transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-6">
                  <div
                    className="h-1.5 bg-[#2d5a8f] rounded-full transition-all duration-300"
                    style={{ width: `${((safeIndex + 1) / orderedCards.length) * 100}%` }}
                  />
                </div>

                {/* Flashcard */}
                <div
                  className="cursor-pointer mb-6"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ perspective: "1200px" }}
                >
                  <div
                    className="relative transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      height: "340px",
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-8"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#2d5a8f] text-xs font-medium rounded-full">
                          {CATEGORY_ICONS[card.category] ?? "📌"} {card.category}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1 font-medium">
                          <BookOpen className="w-4 h-4" /> Tap to reveal answer
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xl text-gray-800 text-center font-medium leading-relaxed">
                          {card.question}
                        </p>
                      </div>
                      <div className="mt-6 flex justify-center">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === 0 ? "bg-[#2d5a8f]" : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 bg-[#2d5a8f] rounded-2xl shadow-sm flex flex-col p-8"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                          {CATEGORY_ICONS[card.category] ?? "📌"} {card.category}
                        </span>
                        <span className="text-xs text-white/60">Answer</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <p className="text-white text-base leading-relaxed mb-4">{card.answer}</p>
                        {card.tip && (
                          <div className="bg-white/15 rounded-xl p-4">
                            <p className="text-xs text-white/80 font-semibold uppercase tracking-wide mb-1">
                              Quick Tip
                            </p>
                            <p className="text-white text-sm leading-relaxed">{card.tip}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/20">
                        <a
                          href={card.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {card.source}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prev}
                    disabled={safeIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white hover:border-[#2d5a8f] hover:text-[#2d5a8f] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
                    {orderedCards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === safeIndex
                            ? "bg-[#2d5a8f] w-4"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={next}
                    disabled={safeIndex === orderedCards.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white hover:border-[#2d5a8f] hover:text-[#2d5a8f] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                  Click the card to flip between question and answer
                </p>
              </>
            )}
          </div>

          {/* Right — data sources */}
          <div className="flex-[2] min-w-0 w-full lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#2d5a8f]" />
                <h3 className="text-sm font-semibold text-gray-800">Data Sources</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                All flashcard content is drawn from Dementia Australia's evidence-based brain health resources.
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Brain health tips & strategies — BrainTrack", url: "https://www.dementia.org.au/braintrack" },
                  { label: "Reduce your risk of dementia", url: "https://www.dementia.org.au/brain-health/reduce-your-risk-dementia" },
                  { label: "How do we maintain a healthy brain?", url: "https://www.dementia.org.au/news/how-do-we-maintain-healthy-brain" },
                  { label: "Brain health habits when living with dementia", url: "https://www.dementia.org.au/news/brain-health-habits-when-living-dementia" },
                  { label: "Could personalised lifestyle plans reduce dementia risk?", url: "https://www.dementia.org.au/news/could-personalised-lifestyle-plans-reduce-dementia-risk" },
                ].map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-xs text-gray-600 hover:text-[#2d5a8f] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-[#2d5a8f]" />
                      <span className="group-hover:underline leading-relaxed">{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Content sourced from{" "}
                  <a
                    href="https://www.dementia.org.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2d5a8f] hover:underline"
                  >
                    dementia.org.au
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
