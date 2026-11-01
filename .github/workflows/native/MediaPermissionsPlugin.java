package com.minhaagenda.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

/** Pede permissão de fotos, vídeos e áudio (Android 13+) ou armazenamento (Android 12 e anterior). */
@CapacitorPlugin(
    name = "MediaPermissions",
    permissions = {
        @Permission(alias = "images", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
        @Permission(alias = "video", strings = { Manifest.permission.READ_MEDIA_VIDEO }),
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MediaPermissionsPlugin extends Plugin {

    private boolean novo() { return Build.VERSION.SDK_INT >= 33; }

    private String st(String alias) {
        PermissionState s = getPermissionState(alias);
        return s == null ? "prompt" : s.toString();
    }

    private JSObject estado() {
        JSObject o = new JSObject();
        if (novo()) {
            o.put("images", st("images"));
            o.put("video", st("video"));
            o.put("audio", st("audio"));
        } else {
            String s = st("storage");
            o.put("images", s);
            o.put("video", s);
            o.put("audio", s);
        }
        return o;
    }

    @PluginMethod
    @Override
    public void checkPermissions(PluginCall call) { call.resolve(estado()); }

    @PluginMethod
    @Override
    public void requestPermissions(PluginCall call) {
        List<String> al = new ArrayList<>();
        if (novo()) {
            JSArray arr = call.getArray("permissions");
            try {
                if (arr != null) for (int i = 0; i < arr.length(); i++) al.add(arr.getString(i));
            } catch (Exception ignored) {}
            if (al.isEmpty()) { al.add("images"); al.add("video"); al.add("audio"); }
        } else {
            al.add("storage");
        }
        requestPermissionForAliases(al.toArray(new String[0]), call, "depois");
    }

    @PermissionCallback
    private void depois(PluginCall call) { call.resolve(estado()); }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        i.setData(Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}
