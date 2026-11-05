"""Build an isolated review page. Does not import or alter combat routing."""
import json, re, shutil
from pathlib import Path
from PIL import Image
root=Path('website/public/previews/branch-card-review');root.mkdir(parents=True,exist_ok=True)
source=Path('website/public/legacy/data.js').read_text().split('const BRANCH_STARTER = [')[1].split('// ============ RILEY')[0]
cards={}
for name,opts in re.findall(r'C\("[^"]+","([^"]+)",\d+,\{(.*?)\}\)',source):
    desc=re.search(r'desc:"([^"]*)"',opts)
    cards[name]={'name':name,'description':desc.group(1) if desc else '', 'opts':opts}
groups={
'jab':['Flame Jab'],
'heavy':['Cinder Fist','Charred Cross','Reckless Blaze',"Branch's Fury",'Phoenix Straight','Hot Hand'],
'kick':['Scorch Kick'],
'fire':['Slow Burn','Emberfy','Lung Smoke','Suffocate','Wildfire Gambit','Living Ember','Phoenix Ember'],
'bolt':['Wraithfire Bolt','Arcane Cinder','Piercing Hex',"Wraith's Grasp",'Phoenix Rebirth',"Willow's Prone Shot",'Phantom Volley','Fireball Candy - Megaton'],
'detonate':['Dark Flame','Fireball Candy - Fafnir','Implode','Burn Bomb','Fireball Candy - C4 Trigger','Hot Flash','Fire Spin',"Thistle's Boom",'Mystic Detonation'],
'eruption':['Solar Flare','Wildfire Lash','Wildfire Haymaker','Phoenix Fire Storm','Fireball Candy - Wildfire','Fireball Candy - Eviscerate','Fireball Candy - Supernova','Branch Bomb','Phoenix Cascade','Fireball Candy - Arcane Immolation','Fireball Candy - Phoenix Reckoning'],
'power':['Fireball Candy - Blood Ignite','Fire Inside','Fireball Candy - Flame On!','Fireball Candy - Phoenix Awakening','Fireball Candy - Cinderguard','Fuel the Fire'],
'block':["Branch's Resolve",'Banked Coals','Cinderwall','Rock Candy - Stoneskin','Nova Guard','Phoenix Ward'],
'heal':["Sage's Remedy"],
'idle':['Draft Up','Christmas Dinner'],
'heavy-gap':['Blazing Edge','Twin Strike'],
}
assigned={n:k for k,names in groups.items() for n in names}
assert set(cards)==set(assigned), (set(cards)-set(assigned),set(assigned)-set(cards))
notes={
'Wildfire Haymaker':'Heavy punch → eruption, not a spell-only gesture. One card resolution, no extra hit.',
'Blazing Edge':'UNRESOLVED: slashing damage does not fit a bare-fist heavy. Preview is a placeholder; needs a fiery cutting-hand motion or an approved change to the card fiction.',
'Twin Strike':'UNRESOLVED: two slashing strikes need a distinct two-hit cutting motion; repeating the same heavy is not final art.',
"Willow's Prone Shot":'Bolt is only a partial fit: the current name explicitly promises a prone shot. Needs a prone pose or approval to rename the card; not silently treated as solved.',
'Phantom Volley':'Repeat release three times for the three random hits; bolt study alone does not establish target travel or gameplay impact timing.',
'Fireball Candy - C4 Trigger':'Marking gesture now; explosion belongs at the next enemy turn, not on card play. This preview shows the motion vocabulary only.',
'Fireball Candy - Phoenix Awakening':'Power-up → heal, no outgoing attack.',
'Fireball Candy - Cinderguard':'Power-up now; block gesture only when the passive actually grants Block.',
'Rock Candy - Stoneskin':'Guard means negate-next-attack, not ordinary Block. Use a distinct persistent shield cue.',
'Draft Up':'Guard/idle plus a card-draw cue; no pretend attack.',
'Christmas Dinner':'Guard/idle plus energy cue; no pretend attack.',
'Phoenix Cascade':'Wide eruption, detonation on burning targets, healing only on actual kills. This study does not preview enemy effects.',
'Fuel the Fire':'Consume target flames and gain energy; no projectile or damage impact.',
'Fireball Candy - Blood Ignite':'Self-ignite aura only; never launch a wave at an enemy.',
'Fire Inside':'Self-ignite aura then draw cue; no enemy damage.',
'Banked Coals':'Draw flames from target → Block → conditional draw. Guard is only one part of the final treatment.',
'Fireball Candy - Wildfire':'Wide eruption plus persistent no-decay cue; the separately reported no-decay rule bug still needs repair.',
}
for n,c in cards.items():
    k=assigned[n]; seq=['heavy'] if k=='heavy-gap' else [k]
    if n=='Wildfire Haymaker':seq=['heavy','eruption']
    if n=='Twin Strike':seq=['heavy','heavy']
    if n=='Phantom Volley':seq=['bolt','bolt','bolt']
    if n=='Phoenix Ward':seq=['block','heal']
    if n in ['Phoenix Ember','Fireball Candy - Phoenix Reckoning','Fireball Candy - Phoenix Awakening','Phoenix Rebirth']:seq+=['heal']
    if n in ['Phoenix Straight','Phoenix Fire Storm','Phoenix Cascade']:seq+=['heal']
    c.update(family=k,sequence=seq,note=notes.get(n,'Keep effects tied to the actual resolved result, not just the card name.'))
    c['conditionalHeal']=n in ['Phoenix Straight','Phoenix Fire Storm','Phoenix Cascade','Phoenix Rebirth']
    c.pop('opts')
clips={}
for folder,ks in [('branch-redraw-attacks',['jab','heavy','fire']),('branch-defense-healing',['kick','block','heal']),('branch-redraw-movement',['idle'])]:
    for k in ks:
        files=sorted(Path('website/public/previews',folder).glob(k+'-*.png'),key=lambda p:int(p.stem.split('-')[-1]))
        order=[2,1,0,1,2] if k=='jab' else list(range(len(files)))
        im=Image.open(files[0]); box=im.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
        defense=k in ['kick','block','heal'];center=(128 if k=='heal' else 80) if defense else (box[0]+box[2])/2
        clips[k]={'files':['../'+folder+'/'+files[i].name for i in order],'anchor':[center,183 if defense else box[3]],'scale':176/(107 if defense else box[3]-box[1]),'ms':100 if k in ['fire','block'] else 110 if k=='heal' else 90,'new':False}
for k,asset in {'detonate':'e066f1c1-929a-57bc-9168-6d1860bf7c49','eruption':'bfa50cd3-7726-531b-a41d-1e36348c54f2','bolt':'84929dda-6da7-5285-a806-5e958a4066ff','power':'d718ac4c-6055-579a-816e-f18464aa21ee'}.items():
    folder=Path('assets/images',asset,'frames');files=sorted(folder.glob('*.png'),key=lambda p:int(p.stem))
    assert len(files)==17
    for i,p in enumerate(files):shutil.copyfile(p,root/f'{k}-{i}.png')
    clips[k]={'files':[f'{k}-{i}.png' for i in range(17)],'anchor':[80,183],'scale':176/107,'ms':100,'new':True}
(root/'review.json').write_text(json.dumps({'cards':list(cards.values()),'clips':clips},indent=2))
print(f'Preview only: {len(cards)} unique cards; {len(clips)} animation families; live code unchanged.')
