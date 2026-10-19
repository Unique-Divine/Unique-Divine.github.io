export type ProjectIconName =
  | "code"
  | "nibiru"
  | "typescript"
  | "rust"
  | "computer"
  | "dna"
  | "school"
  | "database"
  | "notes"

export interface ProjectReference {
  title: string
  href: string
  summary: string
  icon: ProjectIconName
  sourceHref?: string
}

export const chainReference: ProjectReference = {
  title: "Nibiru",
  href: "https://github.com/NibiruChain/nibiru",
  summary:
    "The blockchain implementation, including EVM execution and the Rust contract workspace.",
  icon: "nibiru",
}

export const earlierProjectReferences: ProjectReference[] = [
  {
    title: "grid-world-plus",
    href: "https://github.com/Unique-Divine/grid-world-plus",
    summary:
      "Vision-based reinforcement learning research into transfer learning, representation learning, and attention over memories.",
    icon: "computer",
  },
  {
    title: "GANs for Genomics",
    href: "/code/projects/rats-gans-disease",
    sourceHref: "https://github.com/Unique-Divine/GANs-for-Genomics",
    summary:
      "Computational genomics research using deep learning to generate and learn from synthetic DNA samples.",
    icon: "dna",
  },
  {
    title: "Langevin Dynamics",
    href: "https://github.com/Unique-Divine/Langevin-Dynamics-for-NN-Optimization",
    summary: "Bayesian neural network implementations using Langevin dynamics.",
    icon: "school",
  },
  {
    title: "Sommelier Cellar Subgraphs",
    href: "https://github.com/PeggyJV/cellar-subgraphs/",
    summary: "Event indexing for Sommelier Cellar contracts using The Graph.",
    icon: "database",
  },
  {
    title: "Commonplace Book",
    href: "https://github.com/Unique-Divine/Commonplace-Book",
    summary: "Earlier technical notes and reference material.",
    icon: "notes",
  },
]
