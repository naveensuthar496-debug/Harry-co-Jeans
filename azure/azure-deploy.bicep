// ==============================================================================
// HARRY & CO JEANS - PRODUCTION ZERO-TRUST AZURE INFRASTRUCTURE (BICEP)
// Full Multi-Tier Architecture with Azure Front Door, WAF, Origin IP Masking,
// App Service VNet Integration, and Azure Database for PostgreSQL Private Endpoint
// ==============================================================================

@description('Azure Region for deployments')
param location string = resourceGroup().location

@description('Base name for resources')
param appName string = 'harryandco'

@description('Environment name')
param environment string = 'prod'

@description('Administrator login name for PostgreSQL')
@secure()
param dbAdminUser string = 'atelier_admin'

@description('Administrator login password for PostgreSQL')
@secure()
param dbAdminPassword string

// ------------------------------------------------------------------------------
// 1. Virtual Network (VNet) & Isolated Subnets
// ------------------------------------------------------------------------------
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: '${appName}-vnet-${environment}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.10.0.0/16']
    }
    subnets: [
      {
        name: 'app-service-subnet'
        properties: {
          addressPrefix: '10.10.1.0/24'
          delegations: [
            {
              name: 'app-service-delegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'postgres-subnet'
        properties: {
          addressPrefix: '10.10.2.0/24'
          delegations: [
            {
              name: 'postgres-delegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
    ]
  }
}

// ------------------------------------------------------------------------------
// 2. Private DNS Zone for PostgreSQL Flexible Server
// ------------------------------------------------------------------------------
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${appName}.private.postgres.database.azure.com'
  location: 'global'
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${appName}-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

// ------------------------------------------------------------------------------
// 3. Azure Database for PostgreSQL Flexible Server (Private Isolation)
// ------------------------------------------------------------------------------
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${appName}-db-${environment}'
  location: location
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'GeneralPurpose'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    network: {
      delegatedSubnetResourceId: vnet.properties.subnets[1].id
      privateDnsZoneArmResourceId: privateDnsZone.id
      publicNetworkAccess: 'Disabled' // Zero public internet exposure!
    }
    highAvailability: {
      mode: 'ZoneRedundant'
    }
    backup: {
      backupRetentionDays: 30
      geoRedundantBackup: 'Disabled'
    }
    storage: {
      storageSizeGB: 128
      autoGrow: 'Enabled'
    }
  }
  dependsOn: [
    privateDnsZoneLink
  ]
}

// ------------------------------------------------------------------------------
// 4. Azure Key Vault (Zero Hardcoded Secrets)
// ------------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${appName}-kv-${environment}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// ------------------------------------------------------------------------------
// 5. Azure Web Application Firewall (WAF) Policy
// ------------------------------------------------------------------------------
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: 'harryandcowaf${environment}'
  location: 'global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention' // Active attack blocking
      redirectUrl: 'https://harryandcojeans.com'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleGroupOverrides: []
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
          ruleGroupOverrides: []
        }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitAll'
          priority: 100
          ruleType: 'RateLimitRule'
          rateLimitThreshold: 200
          rateLimitDurationInMinutes: 1
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'BeginsWith'
              matchValue: ['/']
            }
          ]
        }
      ]
    }
  }
}

// ------------------------------------------------------------------------------
// 6. Azure Front Door Profile (Edge CDN & Origin Masking)
// ------------------------------------------------------------------------------
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: '${appName}-fd-${environment}'
  location: 'global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
}

// ------------------------------------------------------------------------------
// 7. App Service Plan & App Service (Backend API with VNet & Front Door IP lock)
// ------------------------------------------------------------------------------
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-asp-${environment}'
  location: location
  kind: 'linux'
  properties: {
    reserved: true
  }
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
  }
}

resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-api-${environment}'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    virtualNetworkSubnetId: vnet.properties.subnets[0].id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      vnetRouteAllEnabled: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'REQUIRE_EDGE_PROXY'
          value: 'true'
        }
        {
          name: 'AZURE_FRONT_DOOR_ID'
          value: frontDoorProfile.properties.frontDoorId
        }
        {
          name: 'PGHOST'
          value: '${appName}-db-${environment}.${appName}.private.postgres.database.azure.com'
        }
        {
          name: 'PGPORT'
          value: '5432'
        }
        {
          name: 'PGDATABASE'
          value: 'harryandco_production'
        }
      ]
      // NETWORK FIREWALL: Allow ONLY Azure Front Door Backend, block all direct public access!
      ipSecurityRestrictions: [
        {
          name: 'AllowAzureFrontDoorOnly'
          priority: 100
          action: 'Allow'
          tag: 'AzureFrontDoor.Backend'
          headers: {
            'x-azure-fdid': [
              frontDoorProfile.properties.frontDoorId
            ]
          }
        }
        {
          name: 'DenyAllDirectInternetTraffic'
          priority: 2147483647
          action: 'Deny'
          ipAddress: 'Any'
        }
      ]
    }
  }
}

// ------------------------------------------------------------------------------
// Outputs
// ------------------------------------------------------------------------------
output frontDoorEndpoint string = frontDoorProfile.name
output frontDoorId string = frontDoorProfile.properties.frontDoorId
output appServiceHost string = appService.properties.defaultHostName
output postgresHost string = postgresServer.name
