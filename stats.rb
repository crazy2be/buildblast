# This file is borrowed from
# https://github.com/github/linguist/blob/master/lib/linguist/repository.rb
# Most of my modifications near the bottom.
# Appologies if the code is difficult to understand, I don't really
# know ruby very well...
require 'linguist/file_blob'

module Linguist
	# A Repository is an abstraction of a Grit::Repo or a basic file
	# system tree. It holds a list of paths pointing to Blobish objects.
	#
	# Its primary purpose is for gathering language statistics across
	# the entire project.
	class Repository
		# Public: Initialize a new Repository from a File directory
		#
		# base_path - A path String
		#
		# Returns a Repository
		def self.from_directory(base_path)
			new Dir["#{base_path}/**/*"].
				select { |f| File.file?(f) }.
				map { |path| FileBlob.new(path, base_path) }
		end

		# Public: Initialize a new Repository
		#
		# enum - Enumerator that responds to `each` and
		#				yields Blob objects
		#
		# Returns a Repository
		def initialize(enum)
			@enum = enum
			@computed_stats = false
			@language = @size = nil
			@sizes = Hash.new { 0 }
			@files = Hash.new
		end

		# Public: Returns a breakdown of language stats.
		#
		# Examples
		#
		#	 # => { Language['Ruby'] => 46319,
		#					Language['JavaScript'] => 258 }
		#
		# Returns a Hash of Language keys and Integer size values.
		def languages
			compute_stats
			@sizes
		end

		# Public: Get primary Language of repository.
		#
		# Returns a Language
		def language
			compute_stats
			@language
		end

		# Public: Get the total size of the repository.
		#
		# Returns a byte size Integer
		def size
			compute_stats
			@size
		end

		def files
			compute_stats
			@files
		end

		# Internal: Compute language breakdown for each blob in the Repository.
		#
		# Returns nothing
		def compute_stats
			return if @computed_stats

			@enum.each do |blob|
				# Skip files that are likely binary
				next if blob.likely_binary?

				# Skip vendored or generated blobs
				next if blob.vendored? || blob.generated? || blob.language.nil?

				# Only include programming languages and acceptable markup languages
# 				if blob.language.type == :programming || Language.detectable_markup.include?(blob.language.name)
				if blob.language.type == :programming
					lang = blob.language.group
					@sizes[lang] += blob.size
					if not @files[lang]
						@files[lang] = Hash.new { 0 }
					end
					@files[lang].store(blob.name, blob.size)
				end
			end

			# Compute total size
			@size = @sizes.inject(0) { |s,(_,v)| s + v }

			# Get primary language
			if primary = @sizes.max_by { |(_, size)| size }
				@language = primary[0]
			end

			@computed_stats = true

			nil
		end
	end
end

project = Linguist::Repository.from_directory(".")

print project.language.name, "\n"

langs = project.languages
files = project.files
langs.each do |lang, size|
	print lang.to_s.ljust(47)," \e[1m", size, "\e[0m", "\n"
	files[lang].sort_by{ |(_, size)| -size }.each do |name, size|
		print "\t", name.to_s.ljust(40), size, "\n"
	end
	puts
end
