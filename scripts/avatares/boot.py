import sys, os, shutil, bpy, addon_utils, importlib
SRC = os.environ["MPFB_SRC"]
ext_root = bpy.utils.user_resource('EXTENSIONS', path="user_default", create=True)
dst = os.path.join(ext_root, "mpfb")
if not os.path.exists(dst):
    shutil.copytree(os.path.join(SRC, "mpfb"), dst)
bpy.ops.preferences.addon_enable(module="bl_ext.user_default.mpfb")
def imp(m, k): return getattr(importlib.import_module("bl_ext.user_default.mpfb."+m), k)
HumanService = imp("services.humanservice","HumanService")
TargetService = imp("services.targetservice","TargetService")
AssetService = imp("services.assetservice","AssetService")
LocationService = imp("services.locationservice","LocationService")
HumanObjectProperties = imp("entities.objectproperties","HumanObjectProperties")
