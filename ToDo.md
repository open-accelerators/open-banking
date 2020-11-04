print out messages at the end
- 3scale admin URL, username and password
- developer portal URL

assets / source code
- API specs
- Mocked Data/APIs
- Developer Portal content
- API deployment CRDs

requirements
- openshift 4
- 3scale (and authentication service account - )
- object storage (s3 interface)


solution architecture components
- developer portal
- api products
- api backends
- microcks
- object storage
- openshift

Quick reference guide
- AgnosticD repository
- Open Banking UK web site
- 

Demo install guide
1) Get your Registry Auth config secret for your Red Hat 3scale Subscription
1) Order an OpenShift 4 cluster using RHPDS
2) Checkout 

x) Once the cluster is provisioned, you're good to remove the 'labs' project to free resources
- OpenShift 4 provisioning
  - OpenShift 4 Getting Started Workshop item from RHPDS catalog
  - Remove the 'labs' project to free resources
  - 
- check out the lastest AgnosticD-fork
- 

installation details
- Microcks
  - create project/namespace
  - sets up the Microcks 0.9 operator
  - create Microcks instance using CRD
- Minio
  - create project/namespace
  - include role to perform Minio installation
  - create bucket for 3scale

- 3scale
  - create project/namespace
  - create Object Storage configuration secret
  - create Registry Auth config secret (to download 3scale images)
  - sets up the 3scale 2.9 via operator
  - create 3cale instance using CRD

deployment procedures
- Microcks
  - import Mocked APIs collections

- 3scale
  - create secret with provider account to deploy CRDs
  - update/upload Developer Portal content
    - sections
    - layouts
    - files
    - pages
    - builtin pages
  - clean up required site access code to Developer Portal
  - deploy each API
    - create API Backend CRD
    - create API Product CRD
    - publish Application Plan defined in the API Product CRD
    - add CORS plugin to Proxy Policies configuration
    - promote the API configuration to Staging
    - upload the API definition as ActiveDoc entry
    -  

walk through the demo
- review the 


contributing
- adding a new API
- customize the mock APIs

