import re

with open('src/app/profile/page.tsx', 'r') as f:
    content = f.read()

packages_ui = """
          {/* Active Packages */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 sm:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-hashtag-red" /> Active Packages
            </h3>
            {packages.length === 0 ? (
              <p className="text-sm text-gray-500">No active packages.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
                          <li key={service} className="flex justify-between border-b border-gray-50 pb-1 last:border-0">
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
"""

# Find a good spot to insert. After Wallet section or Address section.
search = """{/* Settings */}"""
if search in content:
    content = content.replace(search, packages_ui + "\n          " + search)
    with open('src/app/profile/page.tsx', 'w') as f:
        f.write(content)
    print("Fixed profile page.")
else:
    print("Could not find insertion point in profile page.")
