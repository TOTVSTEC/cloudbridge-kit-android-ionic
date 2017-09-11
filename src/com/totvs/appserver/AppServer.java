package com.totvs.appserver;

import android.content.res.*;
import android.content.*;
import java.io.*;
import android.util.*;
/**
 * Created by daniel.bolognani on 28/04/2017.
 */



public class AppServer {
    static {
        System.loadLibrary("AppServer"); // Load native library at runtime
    }

    private Context cContext;

    public AppServer()
    {

    }
    public AppServer(Context context)
    {
        cContext = context;
    }

    public native int runServer(String dir);

    public int main()
    {
        copyAssets("",cContext.getFilesDir().toString());
        return (runServer(cContext.getFilesDir().toString() + "/appserver"));
    }

    private String TAG = "AppServer";

    private void copyAssets(String path, String outPath) {
        AssetManager assetManager = cContext.getAssets();
        String assets[];
        try {
            assets = assetManager.list(path);
            if (assets.length == 0) {
                copyFile(path, outPath);
            } else {
                String fullPath = outPath + "/" + path;
                File dir = new File(fullPath);
                if (!dir.exists())
                    if (!dir.mkdir()) Log.e(TAG, "No create external directory: " + dir );
                for (String asset : assets) {
                    if (asset.equals("appserver.ini") || asset.equals("tttp110.rpo") || asset.equals("totvsappserver.ini"))
                        copyAssets(asset, outPath);
                }
            }
        } catch (IOException ex) {
            Log.e(TAG, "I/O Exception", ex);
        }
    }

    private void copyFile(String filename, String outPath) {
        AssetManager assetManager = cContext.getAssets();

        InputStream in;
        OutputStream out;
        try {
            in = assetManager.open(filename);
            String newFileName = outPath + "/" + filename;
            out = new FileOutputStream(newFileName);

            byte[] buffer = new byte[in.available()];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            in.close();
            out.flush();
            out.close();
        } catch (Exception e) {
            Log.e(TAG, e.getMessage());
        }

    }
}
