import { getPermalink, getBlogPermalink } from './utils/permalinks';
// import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';
import { socialHrefs } from './const';

export const headerData = {
  links: [
    {
      text: 'About',
      links: [
        {
          text: 'About Unique Divine',
          href: getPermalink('/about-unique-divine'),
        },
        {
          text: 'About Nibi, Inc. & Nibiru',
          href: getPermalink('/web3/nibiru/nibi-inc', 'post'),
        },
        // {
        //   text: 'Features (Anchor Link)',
        //   href: getPermalink('/#features'),
        // },
        // {
        //   text: 'Services',
        //   href: getPermalink('/services'),
        // },
        // {
        //   text: 'Pricing',
        //   href: getPermalink('/pricing'),
        // },
        {
          text: 'Contact',
          href: getPermalink('/about-unique-divine#contact'),
        },
        // TODO: Parse for future utility
        // {
        //   text: 'Contact',
        //   href: getPermalink('/contact'),
        // },
        // {
        //   text: 'Terms',
        //   href: getPermalink('/terms'),
        // },
        // {
        //   text: 'Privacy policy',
        //   href: getPermalink('/privacy'),
        // },
      ],
    },
    {
      text: 'Japanese',
      href: getPermalink('/tag/japanese'),
      // TODO: Parse for future utility
      // links: [
      //   {
      //     text: 'Product Details (or Services)',
      //     href: getPermalink('/landing/product'),
      //   },
      // ],
    },
    // TODO: Parse for future utility
    // {
    //   text: 'Japanese',
    //   links: [
    //     {
    //       text: 'SaaS',
    //       href: getPermalink('/jp/saas'),
    //     },
    //     {
    //       text: 'Startup',
    //       href: getPermalink('/jp/startup'),
    //     },
    //     {
    //       text: 'Mobile App',
    //       href: getPermalink('/jp/mobile-app'),
    //     },
    //     {
    //       text: 'Personal',
    //       href: getPermalink('/jp/personal'),
    //     },
    //   ],
    // },
    {
      text: 'Blog / Writings',
      links: [
        {
          text: 'Everything (Latest)',
          href: getBlogPermalink(),
        },
        {
          text: 'Winning',
          href: getPermalink('winning', 'tag'),
        },
        {
          text: 'Coding',
          href: getPermalink('coding', 'category'),
        },
        {
          text: 'Coding | Python',
          href: getPermalink('python', 'tag'),
        },
      ],
    },
  ],
  actions: [
    // { text: 'CTA', href: 'https://twitter.com/DivineNibirun', target: '_blank' },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Socials',
      links: [
        { text: 'X/Twitter (@DivineNibirun)', href: socialHrefs.x },
        { text: 'Instagram (@unique.divine)', href: socialHrefs.instagram },
        { text: 'GitHub (Unique-Divine)', href: socialHrefs.github },
        { text: 'LinkedIn', href: socialHrefs.linkedin },
      ],
    },
    {
      title: 'Nibiru',
      links: [
        { text: 'Website', href: 'https://nibiru.fi' },
        { text: 'Learn About Nibiru', href: 'https://nibiru.fi/docs' },
        { text: 'Nibiru Blog', href: 'https://nibiru.fi/blog' },
        { text: 'Brand Kit', href: 'https://nibiru.fi/brand' },
      ],
    },
  ],
  // secondaryLinks: [
  //   { text: 'Terms', href: getPermalink('/terms') },
  //   { text: 'Privacy Policy', href: getPermalink('/privacy') },
  // ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: 'https://twitter.com/DivineNibirun' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/unique.divine/' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/Unique-Divine' },
    // { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    // { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  // footNote: `
  //   Divine One Ventures, Inc. <a class="text-cyan-400 underline dark:text-muted" href="https://onwidget.com/"> onWidget</a> © 2020-2025 · All rights reserved.
  // `,
  footNote: `
    <a class="text-cyan-400 underline dark:text-muted" href="https://github.com/Unique-Divine">Unique Divine</a> © 2020-2025 · All rights reserved.
  `,
};
