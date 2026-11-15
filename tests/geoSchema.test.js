import test from 'node:test';
import assert from 'node:assert/strict';
import {
 publisherSchema,webSiteSchema,homePageSchema,toolSchema,articleSchema
} from '../src/lib/geoSchema.mjs';
import {
 SITE_NAME,SITE_ORIGIN,SITE_EMAIL,SITE_SOURCE,CONTENT_UPDATE_DATE,THEORY_REFERENCE
} from '../src/data/siteIdentity.js';

test('publisher has only verifiable website identity and a real source repository',()=>{
 const publisher=publisherSchema(),website=webSiteSchema();
 assert.equal(publisher['@type'],'Organization');
 assert.equal(publisher.name,SITE_NAME);
 assert.equal(publisher.email,SITE_EMAIL);
 assert.equal(publisher.url,SITE_ORIGIN+'/about/');
 assert.deepEqual(publisher.sameAs,[SITE_SOURCE]);
 assert.equal(website['@type'],'WebSite');
 assert.equal(website.publisher['@id'],publisher['@id']);
 assert.equal(website.url,SITE_ORIGIN+'/');
 assert.ok(!publisher.foundingDate&&!publisher.award&&!publisher.member,
   'Do not fabricate publisher credentials');
});

test('homepage WebPage declares only visible subjects and a genuine update date',()=>{
 const homepage=homePageSchema('Free chords and piano practice');
 assert.equal(homepage['@type'],'WebPage');
 assert.equal(homepage.dateModified,CONTENT_UPDATE_DATE);
 assert.equal(homepage.about.length,3);
 assert.equal(homepage.url,SITE_ORIGIN+'/');
 assert.equal(homepage.publisher['@id'],publisherSchema()['@id']);
 assert.equal(homepage.author.name,SITE_NAME);
 assert.equal(homepage.author['@id'],publisherSchema()['@id']);
 assert.equal(homepage.author.url,SITE_ORIGIN+'/about/');
});

test('eight browser tools describe their real functionality without fabricated reviews',()=>{
 const routes=[
  '/tools/chord-finder/','/tools/chord-compare/','/tools/chord-library/',
  '/tools/inversion-explorer/','/tools/virtual-piano/','/tools/scales-and-keys/',
  '/tools/chord-progressions/','/tools/metronome/'
 ];
 for(const p of routes){
  const app=toolSchema(p,'Piano practice tool','Browser-based educational tool');
  assert.equal(app['@type'],'WebApplication');
  assert.equal(app.url,SITE_ORIGIN+p);
  assert.equal(app.offers.price,'0');
  assert.equal(app.offers.priceCurrency,'USD');
  assert.equal(app.isAccessibleForFree,true);
  assert.ok(!app.aggregateRating&&!app.review);
 }
 assert.throws(()=>toolSchema('/privacy/','No','No'));
});

test('lessons and guides have truthful Article citation and brand authorship, not invented launch dates',()=>{
 for(const path of [
  '/chords/b-minor/','/chords/c-major-7/',
  '/guides/how-to-read-piano-chords/','/guides/seventh-chords-piano/'
 ]){
  const article=articleSchema({path,headline:'Lesson title',description:'Lesson text'});
  assert.equal(article['@type'],'Article');
  assert.equal(article.author.name,SITE_NAME);
  assert.equal(article.author.url,SITE_ORIGIN+'/about/');
  assert.equal(article.dateModified,CONTENT_UPDATE_DATE);
  assert.equal(article.citation[0].url,THEORY_REFERENCE.url);
  assert.ok(!('datePublished' in article),'Unknown historical publication date should not be guessed');
 }
 assert.throws(()=>articleSchema({path:'/tools/virtual-piano/',headline:'Not an article'}));
});
