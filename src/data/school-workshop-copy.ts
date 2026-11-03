import { parse } from 'yaml';
import rawYaml from './school-workshop-copy.yaml?raw';

export type SchoolWorkshopCopy = {
  workshopPage: {
    intro: string[];
  };
  casebookPage: {
    intro: string[];
    audienceHeading: string;
    audience: string[];
    contactHeading: string;
    contactBeforeLink: string;
    contactLinkLabel: string;
    contactAfterLink: string;
    sidebar: {
      publisher: string;
      ctaLabel: string;
    };
  };
};

export const schoolWorkshopCopy = parse(rawYaml) as SchoolWorkshopCopy;
