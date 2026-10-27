import json, struct, sys
f=open(sys.argv[1],'rb'); f.read(12); l,t=struct.unpack('<II',f.read(8)); j=json.loads(f.read(l))
REQ=["viseme_sil","viseme_PP","viseme_FF","viseme_TH","viseme_DD","viseme_kk","viseme_CH","viseme_SS","viseme_nn","viseme_RR","viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U","eyeBlinkLeft","eyeBlinkRight"]
nodes=[n.get('name') for n in j['nodes']]
print("root nodes:", [j['nodes'][i].get('name') for i in j['scenes'][0]['nodes']])
for m in j['meshes']:
    names=m.get('extras',{}).get('targetNames',[])
    tris=sum(j['accessors'][p['indices']]['count']//3 for p in m['primitives'] if 'indices' in p)
    print(f"mesh {m['name']}: tris={tris} morphs={len(names)}", "| faltan:", [r for r in REQ if r not in names] if names else "-")
for b in ["Hips","Spine","Neck","Head","LeftEye","RightEye"]: print(b, b in nodes)
print("imgs", len(j.get('images',[])), "materials", [m['name'] for m in j.get('materials',[])])
