$sourceWebAppPool = (Get-SPWebApplication https://dev-mattosfilho-website.simbiox.com.br/).ApplicationPool

$webApp = Get-SPWebApplication http://dev-prudential-website.simbiox.com.br

$webApp.ApplicationPool = $sourceWebAppPool

$webApp.ProvisionGlobally()

$webApp.Update()

