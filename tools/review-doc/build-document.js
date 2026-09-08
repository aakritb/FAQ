/**
 * AssurePro question review document.
 *
 * Every question with its answer, extra paragraphs and steps, grouped by the
 * category it belongs to. Built to be edited in Word and handed back: each
 * question carries a small reference code so a question that gets reworded can
 * still be matched to the one it replaces.
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  PageBreak, BorderStyle, LevelFormat, AlignmentType, convertInchesToTwip,
} = require("docx");

const data = JSON.parse(fs.readFileSync(__dirname + "/assurepro.json", "utf8"));

const GREY = "8B8FA3";
const VIOLET = "4735BE";
const INK = "1A1C2E";

const children = [];

/* ------------------------------------------------------------------ cover */

children.push(
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "AssurePro", size: 52, bold: true, color: INK })],
  }),
  new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text: "Question review", size: 32, color: VIOLET })],
  }),
  new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D8D6E6" } },
    children: [new TextRun({
      text: `${data.total} questions across ${data.groups.length} categories`,
      size: 22, bold: true, color: INK,
    })],
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "How to use this document", size: 22, bold: true, color: INK })],
  })
);

for (const line of [
  "Edit the answers directly. Reword, correct, expand — whatever the product actually does.",
  "To remove a question, delete its whole block, or write DELETE next to the question.",
  "To add one, write it wherever it belongs and mark it NEW.",
  "Comments are fine too if you would rather not edit in place.",
]) {
  children.push(new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: line, size: 21 })],
  }));
}

children.push(
  new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text: "What the labels mean", size: 22, bold: true, color: INK })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "Steps", size: 21, bold: true }),
      new TextRun({ text: "   the numbered walkthrough shown under the answer in the help centre.", size: 21 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "More", size: 21, bold: true }),
      new TextRun({ text: "   an extra paragraph shown after the answer. 115 of the questions have one.", size: 21 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "Also in Settings", size: 21, bold: true }),
      new TextRun({ text: "   the question appears under Settings as well as its own category, because it covers a setting for that area. 57 questions are cross-listed this way.", size: 21 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "Ref", size: 21, bold: true }),
      new TextRun({ text: "   the article's identifier. Leave it alone — it is how a reworded question gets matched back to the right article, and how its link stays valid.", size: 21 }),
    ],
  }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Categories other than Settings show only the questions filed under them. The help centre's Settings view is larger than the count here because it also pulls in the cross-listed questions.",
      size: 20, italics: true, color: GREY,
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "Contents", size: 26, bold: true, color: INK })],
  }),
  new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({
      text: "Each category starts on its own page.",
      size: 20, italics: true, color: GREY,
    })],
  })
);

// A written-out list rather than a field: a Word table of contents shows
// nothing until the reader updates it, which is not what you want a reviewer
// to meet on page two.
data.groups.forEach((g) => {
  children.push(new Paragraph({
    spacing: { after: 70 },
    children: [
      new TextRun({ text: g.label, size: 22, bold: true, color: INK }),
      new TextRun({
        text: `   ${g.items.length} question${g.items.length === 1 ? "" : "s"}`,
        size: 21, color: GREY,
      }),
    ],
  }));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

/* -------------------------------------------------------------- questions */

data.groups.forEach((group, gi) => {
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 60, after: 40 },
    children: [new TextRun({ text: group.label, size: 32, bold: true, color: INK })],
  }));
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E4E2F0" } },
    children: [new TextRun({
      text: `${group.items.length} question${group.items.length === 1 ? "" : "s"}`,
      size: 20, color: GREY,
    })],
  }));

  group.items.forEach((item, i) => {
    children.push(new Paragraph({
      spacing: { before: 220, after: 90 },
      keepNext: true,
      children: [new TextRun({ text: `${i + 1}.   ${item.q}`, size: 24, bold: true, color: INK })],
    }));

    children.push(new Paragraph({
      spacing: { after: item.more.length || item.steps.length ? 90 : 60 },
      indent: { left: convertInchesToTwip(0.28) },
      children: [new TextRun({ text: item.a, size: 22 })],
    }));

    item.more.forEach((p) => {
      children.push(new Paragraph({
        spacing: { after: 90 },
        indent: { left: convertInchesToTwip(0.28) },
        children: [
          new TextRun({ text: "More   ", size: 18, bold: true, color: VIOLET }),
          new TextRun({ text: p, size: 22 }),
        ],
      }));
    });

    if (item.steps.length) {
      children.push(new Paragraph({
        spacing: { before: 40, after: 60 },
        indent: { left: convertInchesToTwip(0.28) },
        children: [new TextRun({ text: "STEPS", size: 17, bold: true, color: GREY })],
      }));
      item.steps.forEach((step) => {
        children.push(new Paragraph({
          numbering: { reference: "steps", level: 0 },
          indent: { left: convertInchesToTwip(0.62) },
          spacing: { after: 40 },
          children: [new TextRun({ text: step, size: 21 })],
        }));
      });
    }

    const tail = [];
    if (item.alsoSettings) tail.push("Also in Settings");
    if (item.keywords) tail.push(`Search terms: ${item.keywords}`);
    tail.push(`Ref: ${item.ref}`);
    children.push(new Paragraph({
      spacing: { before: 70, after: 40 },
      indent: { left: convertInchesToTwip(0.28) },
      children: [new TextRun({ text: tail.join("   ·   "), size: 17, color: GREY })],
    }));
  });

  if (gi < data.groups.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
});

/* ------------------------------------------------------------------ build */

const doc = new Document({
  creator: "AssureOne",
  title: "AssurePro question review",
  description: `${data.total} AssurePro help centre questions for review`,
  numbering: {
    config: [{
      reference: "steps",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }],
    }],
  },
  styles: { default: { document: { run: { font: "Calibri", size: 22, color: "23263A" } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(path.join(__dirname, "..", "..", "drafts", "AssurePro-Questions-Review.docx"), buf);
  console.log(`  written: ${buf.length} bytes, ${data.total} questions, ${data.groups.length} categories`);
});
