import * as core from '@actions/core'
import {Octokit} from '@octokit/core'
import {paginateRest} from '@octokit/plugin-paginate-rest'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'

async function run(): Promise<void> {
  try {
    const packageOwner: string = core.getInput('packageOwner')
    const packageName: string = core.getInput('packageName')
    const packageVersionName: string = core.getInput('packageVersionName')

    const MyOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
    const octokit = new MyOctokit({auth: core.getInput('githubToken')})

    const versions = await octokit.paginate(
      octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
      {
        org: packageOwner,
        package_type: 'npm',
        package_name: packageName
      },
      (response, done) => {
        const foundVersion = response.data.find(
          v => v.name === packageVersionName
        )
        if (foundVersion) {
          done()
        }
        return [foundVersion]
      }
    )
    if (versions && versions[0]) {
      core.setOutput('packageVersionId', versions[0].id)
    } else {
      core.setFailed('Version not found')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
