import re

with open('src/app/packages/page.tsx', 'r') as f:
    content = f.read()

# Add a button in the packages header to view active packages
search = """        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-hashtag-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-jakarta pb-safe">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="ml-2 font-bold text-lg text-gray-900 font-syne">Packages</h1>
      </header>"""

replace = """        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-hashtag-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-jakarta pb-safe">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="ml-2 font-bold text-lg text-gray-900 font-syne">Packages</h1>
        </div>
        <button
           onClick={() => router.push('/packages/active')}
           className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100"
        >
            My Packages
        </button>
      </header>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/packages/page.tsx', 'w') as f:
        f.write(content)
    print("Packages page updated")
else:
    print("Could not find packages page insertion point")
