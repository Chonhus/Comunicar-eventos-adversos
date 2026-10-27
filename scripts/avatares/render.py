def render_previews(arm, cfg, OUT):
    import math
    from mathutils import Vector
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get("SAMPLES", 48))
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = int(os.environ.get("RES", 768))
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -0.4
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.82, 0.84, 0.86, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    bpy.context.view_layer.update()
    head = arm.matrix_world @ arm.pose.bones["Head"].head
    eye = (arm.matrix_world @ arm.pose.bones["LeftEye"].head + arm.matrix_world @ arm.pose.bones["RightEye"].head) / 2
    def light(name, loc, energy, size=1.5):
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.size = size
        o = bpy.data.objects.new(name, L); sc.collection.objects.link(o); o.location = loc
        d = eye - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    light("key", eye + Vector((-1.2, -1.8, 0.8)), 160)
    light("fill", eye + Vector((1.5, -1.5, 0.2)), 50)
    light("rim", eye + Vector((0.5, 1.5, 0.6)), 120)
    cam = bpy.data.cameras.new("cam"); cam.lens = 50
    co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
    shots = {"frente": (Vector((0, -1.05, 0.02)), Vector((0, 0, -0.17))),
             "cara":   (Vector((0, -0.55, 0.0)), Vector((0, 0, -0.02))),
             "tresq":  (Vector((-0.6, -0.85, 0.03)), Vector((0, 0, -0.15)))}
    for k, (off, aim) in shots.items():
        if os.environ.get("SHOTS") and k not in os.environ["SHOTS"].split(","): continue
        co.location = eye + off
        d = (eye + aim) - co.location; co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(OUT, f'{cfg["id"]}_{k}.png')
        bpy.ops.render.render(write_still=True)
        print("RENDER", sc.render.filepath)
