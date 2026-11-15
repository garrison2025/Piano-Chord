import {
 SITE_NAME,SITE_ORIGIN,SITE_EMAIL,SITE_SOURCE,CONTENT_UPDATE_DATE,THEORY_REFERENCE
} from '../data/siteIdentity.js';

const absolute=(p)=>new URL(p,SITE_ORIGIN).toString();
const publisherId=absolute('/#publisher');
const websiteId=absolute('/#website');
const publisherRef=()=>({'@id':publisherId});

export function publisherSchema(){
 return {
  '@context':'https://schema.org','@type':'Organization','@id':publisherId,
  name:SITE_NAME,url:absolute('/about/'),email:SITE_EMAIL,
  sameAs:[SITE_SOURCE]
 };
}
export function webSiteSchema(){
 return {
  '@context':'https://schema.org','@type':'WebSite','@id':websiteId,
  name:SITE_NAME,url:absolute('/'),inLanguage:'en',
  publisher:publisherRef(),sameAs:[SITE_SOURCE]
 };
}
export function homePageSchema(description){
 return {
  '@context':'https://schema.org','@type':'WebPage','@id':absolute('/#webpage'),
  name:'Learn Piano Chords Visually | Piano Chord Explorer',url:absolute('/'),
  description,inLanguage:'en',isPartOf:{'@id':websiteId},
  publisher:publisherRef(),
  author:{'@type':'Organization','@id':publisherId,name:SITE_NAME,url:absolute('/about/')},
  dateModified:CONTENT_UPDATE_DATE,
  about:[
   {'@type':'Thing',name:'Piano chords'},
   {'@type':'Thing',name:'Chord inversions'},
   {'@type':'Thing',name:'Online virtual piano'}
  ]
 };
}
// Only directly usable, browser-based learning tools get a WebApplication label.
export function toolSchema(path,name,description){
 if(!/^\/tools\/[a-z-]+\/$/.test(path))throw Error('Expected a stable tool path');
 return {
  '@context':'https://schema.org','@type':'WebApplication','@id':absolute(path+'#webapp'),
  name,description,url:absolute(path),inLanguage:'en',
  applicationCategory:'EducationalApplication',
  operatingSystem:'Any',isAccessibleForFree:true,
  offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},
  publisher:publisherRef(),isPartOf:{'@id':websiteId}
 };
}
// Metadata must agree with visible author, source and review date on the page.
export function articleSchema({path,headline,description,image,updated=CONTENT_UPDATE_DATE}){
 if(!/^\/(chords\/[a-z0-9-]+|guides\/[a-z0-9-]+)\/$/.test(path))
  throw Error('Only original chord lessons and authored guides are articles');
 const page=absolute(path);
 return {
  '@context':'https://schema.org','@type':'Article','@id':page+'#article',
  mainEntityOfPage:page,headline,description,inLanguage:'en',
  isAccessibleForFree:true,
  author:{'@type':'Organization',name:SITE_NAME,url:absolute('/about/')},
  publisher:publisherRef(),dateModified:updated,
  image:image?absolute(image):absolute('/share-card.png'),
  citation:[{'@type':'CreativeWork',name:THEORY_REFERENCE.name,url:THEORY_REFERENCE.url}]
 };
}
