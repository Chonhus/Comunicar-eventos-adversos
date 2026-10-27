import numpy as np
from mathutils import Vector
def _obj(sub):
    for o in bpy.data.objects:
        if o.type=='MESH' and sub.lower() in o.name.lower(): return o
def jaw_width(h, arm):
    """Anchura de la mandíbula: anchura del cuerpo a la altura de la boca, en la mitad frontal de la cabeza."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get(); me = h.evaluated_get(dg).to_mesh()
    eye = (arm.matrix_world @ arm.pose.bones["LeftEye"].head + arm.matrix_world @ arm.pose.bones["RightEye"].head)/2
    hb = arm.matrix_world @ arm.pose.bones["Head"].head
    zj = eye.z - (eye.z - hb.z)*0.95
    xs = [ (h.matrix_world@v.co).x for v in me.vertices if abs((h.matrix_world@v.co).z - zj) < 0.006 and (h.matrix_world@v.co).y < hb.y - 0.01 and abs((h.matrix_world@v.co).x-eye.x) < 0.09 ]
    h.evaluated_get(dg).to_mesh_clear()
    return (max(xs)-min(xs)) if xs else 0
def hair_sides(cfg, arm):
    t = cfg.get("hair_sides"); 
    if not t: return
    o = _obj(t["object"]); M = o.matrix_world; Mi = M.inverted()
    co = np.array([(M@v.co)[:] for v in o.data.vertices])
    cx = co[:,0].mean(); half = (co[:,0].max()-co[:,0].min())/2
    zmin, zmax = co[:,2].min(), co[:,2].max(); H = zmax - zmin
    cy = co[:,1].mean()
    n = 0
    for i, v in enumerate(o.data.vertices):
        x, y, z = co[i]
        side = (abs(x-cx)/half - 0.55)/0.45          # 0 en el centro, 1 en el lateral
        low = 1 - (z - zmin)/H                        # 1 abajo, 0 arriba
        if side <= 0 or y < cy - 0.02: continue       # solo laterales, no la frente
        w = min(1, side) * max(0, low - 0.25)/0.75
        if w <= 0: continue
        d = Vector((np.sign(x-cx)*t.get("out",0.003)*w, 0, -t.get("down",0.1)*H*w))
        v.co = Mi @ (Vector((x,y,z)) + d); n += 1
    print("HAIR_SIDES", o.name, n)
def forehead_wrinkles(cfg, h, arm):
    t = cfg.get("wrinkles")
    if not t: return
    mat = [m for m in h.data.materials if m and m.name.endswith("body")][0]
    img = mat.node_tree.nodes["DiffuseTexture"].image
    W, Hh = img.size; px = np.array(img.pixels[:], dtype=np.float32).reshape(Hh, W, 4)
    eye = (arm.matrix_world @ arm.pose.bones["LeftEye"].head + arm.matrix_world @ arm.pose.bones["RightEye"].head)/2
    hb = arm.matrix_world @ arm.pose.bones["Head"].head
    z0 = eye.z + t.get("z0", 0.025); z1 = eye.z + t.get("z1", 0.075)
    me = h.data; uv = me.uv_layers.active.data
    saved = [(m, m.show_viewport) for m in h.modifiers]
    for m, _ in saved: m.show_viewport = False
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    ev = h.evaluated_get(dg).to_mesh(); EV = [h.matrix_world @ v.co for v in ev.vertices]
    for m, vis in saved: m.show_viewport = vis
    mask = np.zeros((Hh, W), np.float32)
    lines = t.get("lines", [0.25, 0.5, 0.75]); sig = t.get("sigma", 0.05); xw = t.get("xwidth", 0.05)
    for poly in me.polygons:
        P = [EV[vi] for vi in poly.vertices]
        if not all(p.y < hb.y - 0.02 and z0-0.01 < p.z < z1+0.01 and abs(p.x-eye.x) < xw+0.01 for p in P): continue
        U = [uv[li].uv for li in poly.loop_indices]
        for a, b, c in [(0,1,2),(0,2,3)] if len(P)==4 else [(0,1,2)]:
            tri_uv = np.array([U[a],U[b],U[c]]) * [W, Hh]; tri_p = [P[a],P[b],P[c]]
            x0,y0 = np.floor(tri_uv.min(0)).astype(int); x1,y1 = np.ceil(tri_uv.max(0)).astype(int)
            xs, ys = np.meshgrid(np.arange(x0,x1+1), np.arange(y0,y1+1))
            v0 = tri_uv[1]-tri_uv[0]; v1 = tri_uv[2]-tri_uv[0]; den = v0[0]*v1[1]-v1[0]*v0[1]
            if abs(den) < 1e-9: continue
            dx = xs+0.5-tri_uv[0][0]; dy = ys+0.5-tri_uv[0][1]
            l1 = (dx*v1[1]-v1[0]*dy)/den; l2 = (v0[0]*dy-dx*v0[1])/den; l0 = 1-l1-l2
            inside = (l0>=0)&(l1>=0)&(l2>=0)
            px3 = l0*tri_p[0].x + l1*tri_p[1].x + l2*tri_p[2].x
            pz3 = l0*tri_p[0].z + l1*tri_p[1].z + l2*tri_p[2].z
            rx = (px3 - eye.x)/xw                       # -1..1 a lo ancho de la frente
            rz = (pz3 - z0)/(z1 - z0) - 0.06*(rx**2)    # líneas ligeramente arqueadas
            val = np.zeros_like(rz)
            for k, L in enumerate(lines):
                g = np.exp(-((rz-L)/sig)**2) - 0.35*np.exp(-((rz-L-sig*1.6)/sig)**2)   # surco + brillo encima
                val += g * (0.75 + 0.25*np.cos(rx*3.0 + k))
            val *= np.clip(1-np.abs(rx), 0, 1)**0.7
            ok = inside & (xs>=0)&(xs<W)&(ys>=0)&(ys<Hh)
            mask[ys[ok], xs[ok]] = np.where(np.abs(val[ok])>np.abs(mask[ys[ok], xs[ok]]), val[ok], mask[ys[ok], xs[ok]])
    s = t.get("strength", 0.16)
    px[..., :3] *= (1 - s*np.clip(mask,-1,1))[..., None]
    img.pixels.foreach_set(np.clip(px,0,1).astype(np.float32).ravel()); img.save()
    print("WRINKLES", int((mask>0.1).sum()), "px")
def swap_textures(cfg):
    for key, path in cfg.get("swap_textures", {}).items():
        o = _obj(key); fp = AssetService.find_asset_absolute_path(path, asset_subdir="eyes") if not os.path.isabs(path) else path
        for m in o.data.materials:
            for nn in ("DiffuseTexture","AlphaMapTexture"):
                n = m.node_tree.nodes.get(nn)
                if n: n.image = bpy.data.images.load(fp, check_existing=True)
        print("SWAP", o.name, fp)
