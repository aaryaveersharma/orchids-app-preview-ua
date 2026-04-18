import re

with open('src/app/profile/page.tsx', 'r') as f:
    content = f.read()

packages_ui = """
        {/* Active Packages */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Active Packages</h3>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
            {packages.length === 0 ? (
              <p className="text-sm text-gray-500">No active packages.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-base">{pkg.packages?.name || 'Package'}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {pkg.status.toUpperCase()}
                      </span>
                    </div>
                    {pkg.purchased_at && (
                      <p className="text-xs text-gray-500 mb-3">Purchased: {new Date(pkg.purchased_at).toLocaleDateString()}</p>
                    )}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Remaining Services:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {pkg.service_allowances && Object.entries(pkg.service_allowances).map(([service, count]: [string, any]) => (
                          <li key={service} className="flex justify-between border-b border-gray-200 pb-1 last:border-0">
                            <span>{service}</span>
                            <span className="font-semibold">{count as number}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
"""

search = """{/* Manage Section */}"""
if search in content:
    content = content.replace(search, packages_ui + "\n        " + search)
    with open('src/app/profile/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed profile page.")
else:
    print("Could not find insertion point.")
