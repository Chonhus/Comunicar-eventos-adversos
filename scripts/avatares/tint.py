import numpy as np
def apply_tints(cfg, OUT):
    tdir = os.path.join(OUT, "tex"); os.makedirs(tdir, exist_ok=True)
    for key, t in cfg.get("tints", {}).items():
        sat, rgb, gain = t.get("sat", 1.0), t.get("rgb", [1,1,1]), t.get("gain", 1.0)
        for o in bpy.data.objects:
            if o.type != 'MESH': continue
            for m in o.data.materials:
                if not m or not m.node_tree: continue
                if key.lower() not in o.name.lower() and key.lower() != m.name.lower(): continue
                n = m.node_tree.nodes.get("DiffuseTexture")
                if not n or not n.image: continue
                src = n.image; src.reload()
                w, h = src.size; px = np.array(src.pixels[:], dtype=np.float32).reshape(-1, 4)
                lum = (px[:, :3] @ np.array([0.299, 0.587, 0.114]))[:, None]
                c = lum + (px[:, :3] - lum) * sat
                c = np.clip(c * np.array(rgb) * gain, 0, 1)
                new = bpy.data.images.new(f"{cfg['id']}_{key}_{m.name}", w, h, alpha=True)
                out = np.concatenate([c, px[:, 3:4]], axis=1).astype(np.float32).ravel()
                new.pixels.foreach_set(out)
                fp = os.path.join(tdir, new.name + ".png"); new.filepath_raw = fp; new.file_format = 'PNG'; new.save()
                n.image = new
                # alpha: el alfa sigue saliendo de la textura original (AlphaMapTexture)
                print("TINT", o.name, m.name)
