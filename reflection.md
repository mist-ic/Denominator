# Reflection

Shipping Denominator reinforced a few lessons about small LLM products and class submissions. The parts that worked best were exactly the boring ones: a single streaming API route, strict separation of system prompts from UI, and personas defined as data rather than copy pasted through components. Once `personas.js` owned the voice, the rest of the app became predictable. The chat UI only had to post `{ message, persona, history }` and render SSE chunks, so debugging stayed localized when something broke.

The GIGO principle showed up immediately in prompt design, not in React state. Early drafts that leaned on generic “be encouraging” language collapsed the three voices together. The model politely converged on the same cadence unless each prompt forced distinct few-shot examples and persona-specific chain-of-thought rules. The fix was not more temperature, it was richer constraints and examples. That matches what we tell students about interviews: the quality of the framing determines whether the rest of the pipeline can succeed.

What also worked was keeping the MVP scope honest. A persona switcher that clears history, suggestion chips only on an empty thread, and a typing indicator reads as intentional polish without needing a full design system or auth. Dark styling with glassmorphism is a few CSS variables and blur, not a component library. For grading, the artifact that matters alongside the UI is documentation: `prompts.md` makes the reasoning legible to a reviewer, and the README ties setup to deployment.

Tone is part of product definition too. The high-energy persona was easy to oversteer into sounding rude in a demo, so we iterated on constraints and few-shots until it stayed punchy without punching down. Small wording changes in constraints mattered more than tweaking model parameters.

If I extended this after submission, I would add automated eval hooks: a handful of fixed user prompts per persona and a simple rubric check (length, refusal behavior, banned phrases). I would also revisit model choice over time because the best demo model is not always the best production model when latency variance changes. Voice features are tempting, but only after the text loop is boringly reliable.

Overall, the project is a compact reminder that “AI app” quality is mostly product definition: who is speaking, what they refuse, and what proof you give the model through examples. The engineering is there to serve that definition, not the other way around.
