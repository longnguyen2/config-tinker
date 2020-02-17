# config-tinker
1. Install config-tinker globally: `npm install config-tinker -g`  
Copy sub-project/module android path that need to be implemented  
Then run `config-tinker --module /Users/admin/Downloads/TestTinker/app --config`

2. &lt;Optional&gt; Run `config-tinker --module /Users/admin/Downloads/TestTinker/app --firebase` (to download google-services.json) or you can download on firebase console
Email and password: view in notebook

3. Migrate Application class to ApplicationLike class  
    Before  
    <img src="https://i.imgur.com/YtlFUJ7.png" />  
    After  
    <img src="https://i.imgur.com/B3Uxjiu.png" />  
4. Add this line to launcher activity onCreate method  
    PatchingUtil.checkForUpdate(this);  
    <img src="https://i.imgur.com/VIfXE9e.png" />  