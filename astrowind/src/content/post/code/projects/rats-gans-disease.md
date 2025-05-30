---
publishDate: 2020-11-15
author: Unique Divine
title: 'Rats, Genes, and Disease Prediction with Generative AI'
excerpt: 'I came across a fascinating insight in the field of genomics. Old school linear methods like polygenic risk scores (PRSs) can surprisingly outperform modern neural networks in predicting complex genetic disorders.'
image: '/code/projects/dna-helix-blue.jpg'
tags:
  - coding
  - projects
category: Coding
---

Multiple papers have shown that neural networks are generally less effective
for prediction of complex genetic disorders than polygenic risk scores (PRSs)
even though PRSs are linear predictors [[Pinto et al., 2019](#references)]
[[Mamani, 2020](#references)] [[Badré et al., 2020](#references)].

I found this surprising at first but grew to understand why after discovering
what _challenges_ arise when working with genomics datasets for predictive
modeling.

1. **High-dimensional feature sets**: Input vectors can have on the order of
   100,000+ features.
2. **Extremely low number of training samples**: Deep neural nets need plenty
   of data, and in the case of genomics, we probably won't have plenty of
   relevant samples.
3. **Datasets are often heavily imbalanced**: This is especially true for
   case-control predictions. Usually, you'll have a small number of cases and
   lots of controls. Tons of healthy samples and very few "sick" ones. The
   phenotypes tend not to have an even spread.

These challenges make training performant deep learning models for genomic
predictions an arduous task. I spent the past few months creating a solution
for one problem in particular: having insufficient training samples.

**TLDR**: I research the effectiveness of using **generative adversarial
networks (GANs) to simulate synthetic samples**. In doing so, I hope to create
more plentiful training data, achieve higher performance on genomic
predictions, and reach a greater understanding of the relevant loci in the
genome. The central aim of this project is to investigate the viability of
neural networks for identifying predictive variants in the genome.

[[Code link][code-repo]]

[code-repo]: https://github.com/Unique-Divine/GANs-for-Genomics
[ref]: #References-&-Acknowledgements

## Dataset Description

**Samples**: Sprague Dawley rats from GWAS

- Sample size: 4106 rats
- Between two laboratories, there were high-quality genotypes at
  approximately 220,000 SNPs, of which about 90,000 were common
  between the labs.

**Features**: Integer-encoded allele frequencies. For example, if A was the
reference (most common) allele at some locus, it was represented as 0 and the
next most common allele would be represented by 1.

**Targets**: Groupings from PavCA, or Pavlovian conditioned approach. The
targets were also integer-encoded but were based on whether the rats were goal
trackers (0), intermediate responders (1), or sign trackers(2).

**PavCA**: PavCA is a behavior that develops after response-independent
presentation of a conditioned stimulus that predicts deliver of an
unconditioned stimulus. In layman's terms, this would be something like giving
a rat food or drugs (unconditioned stimulus) when it interacts with a lever or
bell (conditioned stimulus) and observing what various responses. In general, 3
patterns of conditioned responses develop:

- GT (goal-tracking): Unconditioned stimulus-directed
  - Behavior directed by the goal
  - If the reward stops, the behavior stops
- IR (intermediate response): In between
- ST (sign-tracking): Persistent
  - Persisten motivation by reward-related cues, sometimes despite non-reinforcement
  - Susceptible to addiction-related behaviors

#### Data Source:

- For more information on the data used in this analysis, refer to the
  following paper:
  > Gileta, A. et al. (2018). Genetic characterization of outbred Sprague
  > Dawley rats and utility for genome-wide association studies. _bioRxiv_, 412924. [[paper][gileta-genetic]]
- The data is available for download in [variant call format (VCF)][vcf-wiki]
  on [Alex Gileta's Github][gileta-github].

[gileta-github]: https://github.com/agileta/SD_PavCA_GWAS/blob/master/allChr.allSamps.90DR2.maf01.hweE7.noIBD.CharlesRiverOnly.vcf.gz
[vcf-wiki]: https://en.wikipedia.org/wiki/Variant_Call_Format
[gileta-genetic]: https://www.biorxiv.org/content/biorxiv/early/2018/09/10/412924.full.pdf

<!-- Image from paper -->

<!-- Experiments  -->

<!-- Results -->

<!-- Next Steps
    PRS comparison
    Image transformation
-->

## References

This was a one-semester research project I worked on in the computer science
department at Columbia University.

- PhD Student Mentor: Jie Yuan
- Advisor: Dr. Itsik Pe'er

Any opinions, findings, and conclusions or recommendations expressed in this
material are those of the author(s) and do not necessarily reflect the views of
Columbia University.

- Pinto, C., Gill, M., & Heron, E. A. (2019). Can artificial neural networks
  supplant the polygene risk score for risk prediction of complex disorders
  given very large sample sizes?. _arXiv preprint arXiv:1911.08996_.
- Mamani, N. M. (2020). Machine Learning techniques and Polygenic Risk Score
  application to prediction genetic diseases. _ADCAIJ: Advances in Distributed
  Computing and Artificial Intelligence Journal_, 9(1), 5-14.
- Badré, A., Zhang, L., Muchero, W., Reynolds, J. C., & Pan, C. (2020). Deep
  neural network improves the estimation of polygenic risk scores for breast
  cancer. _Journal of Human Genetics_, 1-11.
- Yelmen, B., Decelle, A., Ongaro, L., Marnetto, D., Montinaro, F., Furtlehner,
  C., ... & Jay, F. (2019). Creating Artificial Human Genomes Using Generative
  Models. [[PDF](https://hal.archives-ouvertes.fr/hal-02413942/document)]
- Gileta, A. et al. (2018). Genetic characterization of outbred Sprague Dawley
  rats and utility for genome-wide association studies. _bioRxiv_, 412924.
  [[PDF][gileta-genetic]]
