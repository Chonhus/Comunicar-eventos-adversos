# Uso: python build.py config.json
import sys, json, os, math
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "boot.py")).read())
from mathutils import Vector
cfg = json.load(open(sys.argv[-1]))
TH = os.environ["TH_DIR"]
OUT = cfg["out_dir"]; os.makedirs(OUT, exist_ok=True)
mp = importlib.import_module("bl_ext.user_default.mpfb")
Rig = imp("entities.rig","Rig"); RigService = imp("services.rigservice","RigService")
ExportService = imp("services.exportservice","ExportService"); ObjectService = imp("services.objectservice","ObjectService")

bpy.ops.wm.read_factory_settings(use_empty=True)
h = HumanService.create_human()
for k, v in cfg["macros"].items():
    HumanObjectProperties.set_value(k, v, entity_reference=h)
TargetService.reapply_macro_details(h)
tdir = LocationService.get_mpfb_data("targets")
for rel, w in cfg.get("targets", {}).items():
    p = os.path.join(tdir, rel + ".target.gz")
    if os.path.exists(p): TargetService.load_target(h, p, weight=w)
    else: print("FALTA TARGET", rel)

# Rig TalkingHead
rig = Rig.from_json_file_and_basemesh(os.path.join(TH, "talkinghead.mpfbskel"), h)
arm = rig.create_armature_and_fit_to_basemesh()
arm.name = "Armature"
RigService.normalize_rotation_mode(arm)
h.parent = arm; arm.location = h.location; h.location = (0,0,0)
RigService.load_weights(arm, h, os.path.join(TH, "talkinghead.mhw"))
RigService.ensure_armature_modifier(h, arm)
# Piel y assets (si el pack de sistema está instalado)
def asset(fname, sub):
    return AssetService.find_asset_absolute_path(fname, asset_subdir=sub)
skin = cfg.get("skin"); sp = asset(skin, "skins") if skin else None
HumanService.set_character_skin(sp, h, skin_type="GAMEENGINE" if sp else "LAYERED", material_instances=False)
for item in cfg.get("assets", []):
    sub, fname, atype = item[:3]
    p = asset(fname, sub)
    if p:
        ob = HumanService.add_mhclo_asset(p, h, asset_type=atype, subdiv_levels=0, material_type="GAMEENGINE")
        opts = item[3] if len(item) > 3 else {}
        if opts.get("solo_pantalon"):
            # Quitar la parte de arriba del conjunto: borrar vértices por encima de la cintura
            bpy.context.view_layer.update()
            zc = (arm.matrix_world @ arm.pose.bones["Spine1"].head).z
            import bmesh
            bm_ = bmesh.new(); bm_.from_mesh(ob.data); bm_.verts.ensure_lookup_table()
            seen=set(); kill=[]; parts=0
            for v0 in bm_.verts:
                if v0.index in seen: continue
                comp=[]; stack=[v0]; seen.add(v0.index)
                while stack:
                    v=stack.pop(); comp.append(v)
                    for e in v.link_edges:
                        w=e.other_vert(v)
                        if w.index not in seen: seen.add(w.index); stack.append(w)
                parts+=1
                if max((ob.matrix_world @ v.co).z for v in comp) > zc: kill += comp
            bmesh.ops.delete(bm_, geom=kill, context='VERTS'); bm_.to_mesh(ob.data); bm_.free()
            print("PIEZAS", parts)
            print("SOLO_PANTALON", ob.name, len(kill))
    else: print("FALTA ASSET", sub, fname)

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tint.py")).read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tweaks.py")).read())
swap_textures(cfg)
apply_tints(cfg, OUT)
hair_sides(cfg, arm)
forehead_wrinkles(cfg, h, arm)
print("JAW_WIDTH", round(jaw_width(h, arm), 4))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, cfg["id"] + ".blend"))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "render.py")).read())
render_previews(arm, cfg, OUT)
if os.environ.get("SOLO_RENDER"): sys.exit(0)

# Copia de exportación
cp = ExportService.create_character_copy(h, name_suffix="_exp")
bm = ObjectService.find_object_of_type_amongst_nearest_relatives(cp)
TargetService.bake_targets(bm)
th = sys.modules["th_addon"] if "th_addon" in sys.modules else None
spec = importlib.util.spec_from_file_location("th_addon", os.path.join(TH, "talkinghead-addon.py"))
th = importlib.util.module_from_spec(spec); sys.modules["th_addon"] = th; spec.loader.exec_module(th)
meshes = [o for o in [cp] + ObjectService.get_list_of_children(cp) if o.type == 'MESH']
th.build_targets(mp, meshes, os.path.join(TH, "talkinghead-targets.zip"))
ExportService.bake_modifiers_remove_helpers(bm, bake_masks=True, bake_subdiv=True, remove_helpers=True, also_proxy=True)

# viseme_sil vacío (neutro), creado al final y a 0
if bm.data.shape_keys and "viseme_sil" not in bm.data.shape_keys.key_blocks:
    k = bm.shape_key_add(name="viseme_sil", from_mix=False); k.value = 0.0
for o in [cp] + ObjectService.get_list_of_children(cp):
    if o.type == 'MESH' and o.data.shape_keys:
        for k in o.data.shape_keys.key_blocks: k.value = 0.0
# Separar un poco la ropa del cuerpo para evitar que asome la piel
for o in [cp] + ObjectService.get_list_of_children(cp):
    if o.type == 'MESH' and ObjectService.get_object_type(o) == "Clothes" and not o.data.shape_keys:
        for v in o.data.vertices: v.co += v.normal * float(cfg.get("clothes_push", 0.004))
        print("PUSH", o.name)
# Materiales para glTF: OPACO salvo pelo/cejas/pestañas (MASK)
CUTOUT = ("high-poly","low-poly","hair","eyebrow","eyelash","short0","ponytail","bob0","braid","long0","afro")
for o in [cp] + ObjectService.get_list_of_children(cp):
    if o.type != 'MESH': continue
    for m in o.data.materials:
        if not m or not m.node_tree: continue
        nt = m.node_tree; bsdf = nt.nodes.get("Principled BSDF")
        if not bsdf: continue
        for l in list(bsdf.inputs["Alpha"].links): nt.links.remove(l)
        if any(c in o.name.lower() for c in CUTOUT):
            a = nt.nodes.get("AlphaMapTexture") or nt.nodes.get("DiffuseTexture")
            gt = nt.nodes.new("ShaderNodeMath"); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.5
            nt.links.new(a.outputs["Alpha"], gt.inputs[0]); nt.links.new(gt.outputs[0], bsdf.inputs["Alpha"])
            print("MASK", o.name)
        else:
            bsdf.inputs["Alpha"].default_value = 1.0
            try: m.surface_render_method = 'DITHERED'
            except Exception: pass
# Borrar original, dejar solo la copia, raíz "Armature"
for o in list(bpy.data.objects):
    if o != cp and o not in ObjectService.get_list_of_children(cp): bpy.data.objects.remove(o, do_unlink=True)
cp.name = "Armature"
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects: o.select_set(True)
bpy.context.view_layer.objects.active = cp
th.scale_character([cp])
REF = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "ref_bones.json")))
bpy.ops.object.mode_set(mode='EDIT')
eb = cp.data.edit_bones
for b in eb: b.use_connect = False
n_al = 0
for name, d in REF.items():
    b = eb.get(name)
    if not b: continue
    L = b.length; b.tail = b.head + Vector(d["y"]) * L; b.align_roll(Vector(d["z"])); n_al += 1
bpy.ops.object.mode_set(mode='OBJECT')
print("ALIGNED", n_al)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects: o.select_set(True)
bpy.context.view_layer.objects.active = cp
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
glb = os.path.join(OUT, cfg["id"] + ".glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_animations=False, export_morph=True, export_morph_normal=True, export_skins=True, export_yup=True)
print("GLB_OK", glb, os.path.getsize(glb))
